"use client";

import { useEffect, useState } from "react";

// Not in lib.dom yet: Chromium-only (Chrome/Edge on Android, Windows, desktop).
type InstallEvent = Event & { prompt: () => Promise<void> };

// Registers the service worker (public/sw.js) and offers a one-time install banner:
// an Install button where the browser supports it (Android, Windows), or an
// "Add to Home Screen" hint on iOS Safari, which has no install prompt.
export default function Pwa() {
  const [hint, setHint] = useState<"ios" | InstallEvent | null>(null);

  useEffect(() => {
    // Production only: a service worker fights Turbopack HMR in dev.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    }
    let dismissed = false;
    try {
      dismissed = !!localStorage.getItem("pwaHint");
    } catch {}
    // Dismissed: leave the browser's own install UI (address-bar icon, menu) alone.
    if (dismissed || matchMedia("(display-mode: standalone)").matches) return;

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only check, must run after hydration
      setHint("ios");
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault(); // hold the browser's own mini-infobar; our button fires it instead
      setHint(e as InstallEvent);
    };
    const onInstalled = () => setHint(null);
    addEventListener("beforeinstallprompt", onPrompt);
    addEventListener("appinstalled", onInstalled);
    return () => {
      removeEventListener("beforeinstallprompt", onPrompt);
      removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!hint) return null;
  return (
    <div className="surface-card fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 p-3 text-sm sm:left-auto sm:max-w-sm">
      {hint === "ios" ? (
        <p className="flex-1">
          Install Pathshala: tap Share <span aria-hidden>⎙</span> then &ldquo;Add to Home Screen&rdquo;.
        </p>
      ) : (
        <>
          <p className="flex-1">Install Pathshala for quick access and offline lessons.</p>
          <button
            type="button"
            className="btn-primary px-3 py-1.5"
            // The event is single-use; the browser fires a fresh one if the user cancels.
            onClick={() => hint.prompt().finally(() => setHint(null))}
          >
            Install
          </button>
        </>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        className="btn-ghost px-2"
        onClick={() => {
          setHint(null);
          try {
            localStorage.setItem("pwaHint", "1");
          } catch {}
        }}
      >
        ✕
      </button>
    </div>
  );
}

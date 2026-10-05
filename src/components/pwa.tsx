"use client";

import { useEffect, useState } from "react";

// Registers the service worker (public/sw.js) and, on iOS Safari — which has no
// install prompt — shows a one-time "Add to Home Screen" hint.
export default function Pwa() {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    // Production only: a service worker fights Turbopack HMR in dev.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    }
    let dismissed = false;
    try {
      dismissed = !!localStorage.getItem("pwaHint");
    } catch {}
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const installed = matchMedia("(display-mode: standalone)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only check, must run after hydration
    setHint(ios && !installed && !dismissed);
  }, []);

  if (!hint) return null;
  return (
    <div className="surface-card fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 p-3 text-sm sm:left-auto sm:max-w-sm">
      <p className="flex-1">
        Install Pathshala: tap Share <span aria-hidden>⎙</span> then &ldquo;Add to Home Screen&rdquo;.
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="btn-ghost px-2"
        onClick={() => {
          setHint(false);
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

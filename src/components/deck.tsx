"use client";

import { useEffect, useRef } from "react";
import "reveal.js/reveal.css";
import "reveal.js/theme/white.css";
import "katex/dist/katex.min.css";

// ponytail: init reveal once, never re-render children — interactive components
// (Quiz, etc.) own their own state, so React reconciliation never fights reveal's
// DOM mutations. Don't add deck-level state that re-renders children.
//
// onReady hands the live Reveal instance to a parent (presenter broadcasts slide
// changes, viewer follows them). viewer locks navigation so students can't roam.
export default function Deck({
  children,
  onReady,
  viewer = false,
}: {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReady?: (instance: any) => void;
  viewer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let deck: { destroy: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const Reveal = (await import("reveal.js")).default;
      if (cancelled || !ref.current) return;
      const instance = new Reveal(ref.current, {
        embedded: true,
        hash: false,
        ...(viewer ? { controls: false, keyboard: false, touch: false } : {}),
      });
      await instance.initialize();
      if (cancelled) return;
      deck = instance;
      onReady?.(instance);
    })();

    // React 19 StrictMode double-invokes effects in dev — destroy() prevents a
    // duplicate deck and leaked listeners.
    return () => {
      cancelled = true;
      deck?.destroy();
    };
    // Init once; onReady/viewer are read on first mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="reveal" ref={ref}>
      <div className="slides">{children}</div>
    </div>
  );
}

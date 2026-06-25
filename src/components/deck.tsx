"use client";

import { useEffect, useRef } from "react";
import "reveal.js/reveal.css";
import "reveal.js/theme/white.css";
import "katex/dist/katex.min.css";

// ponytail: init reveal once, never re-render children — interactive components
// (Quiz, etc.) own their own state, so React reconciliation never fights reveal's
// DOM mutations. Don't add deck-level state that re-renders children.
export default function Deck({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let deck: { destroy: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const Reveal = (await import("reveal.js")).default;
      if (cancelled || !ref.current) return;
      const instance = new Reveal(ref.current, { embedded: true, hash: false });
      await instance.initialize();
      deck = instance;
    })();

    // React 19 StrictMode double-invokes effects in dev — destroy() prevents a
    // duplicate deck and leaked listeners.
    return () => {
      cancelled = true;
      deck?.destroy();
    };
  }, []);

  return (
    <div className="reveal" ref={ref}>
      <div className="slides">{children}</div>
    </div>
  );
}

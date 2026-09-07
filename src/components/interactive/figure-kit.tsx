"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import "./matrix-figures.css";

// Shared scaffolding for the interactive figures in the deep-learning article.
// Kept separate so matrix-figures.tsx (canvas demos ported from the deck) and
// vector-figures.tsx (SVG/DOM demos written for the article) share one shell,
// one stylesheet and one lifecycle rule.

/**
 * The article's answer to the deck's useSlideLifecycle.
 *
 * A slide knows it is on screen because reveal writes a `present` class on it. A
 * scrolling article has no such signal, so a figure watches its own visibility:
 * it wakes when scrolled into view and sleeps when it leaves, which keeps
 * long-running loops (an angle sweep, a 3D orbit) off the frame budget.
 */
export function useInView(
  ref: RefObject<HTMLElement | null>,
  life: { enter?: () => void; leave?: () => void },
) {
  // Callbacks are re-created every render; the observer is installed once, so it
  // reads the newest ones through a ref, updated in an effect (never in render).
  const latest = useRef(life);
  useEffect(() => {
    latest.current = life;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? latest.current.enter?.() : latest.current.leave?.()),
      { rootMargin: "-5% 0px -5% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      latest.current.leave?.();
    };
  }, [ref]);
}

export function Btn({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="mfig-btn" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export function Head({ n, title }: { n: string; title: string }) {
  return (
    <div className="mfig-head">
      <span className="mfig-n">{n}</span>
      <b>{title}</b>
    </div>
  );
}

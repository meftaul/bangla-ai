"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import "./matrix-figures.css";

// Shared scaffolding for the interactive figures in the deep-learning article.
// Kept separate so matrix-figures.tsx (canvas demos on ./matrix-engine) and
// vector-figures.tsx (SVG/DOM demos) share one shell, one stylesheet and one
// lifecycle rule.

/**
 * Wake a figure when it is on screen, sleep it when it is not.
 *
 * A scrolling article gives a figure no "you are visible now" signal, so it
 * watches its own visibility:
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

const BN = "০১২৩৪৫৬৭৮৯";
/**
 * Bangla numerals for the Bangla sentences.
 *
 * The figures keep ASCII digits inside the data itself — a pixel value, a place
 * value, a vector element — because those are the machine's numbers and they
 * have to line up in a monospaced grid. Everything the reader is *told*, rather
 * than shown, gets Bangla numerals through here.
 */
export const bn = (v: number | string) => String(v).replace(/\d/g, (d) => BN[Number(d)]);

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

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Small shared pieces for Journey screens (image-journey.tsx, binary-journey.tsx):
// the motion vocabulary, two playback hooks, and the bits of chrome every screen
// uses — speech bubbles, predict-then-watch choices, sub-goal ticks, buttons.
//
// Tailwind only, on the site's theme tokens. `win-pop` and `nudge` are the
// site's existing animation classes (the Journey's own Check uses them too).

// ---------------------------------------------------------------------------
// Motion. Entrances use @starting-style (Tailwind `starting:`), so an element
// animates in simply by being mounted — and every Journey screen mounts fresh.

/** pop in from nothing, with a little overshoot */
export const POP =
  "origin-center [transform-box:fill-box] transition-[scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none starting:scale-0 starting:opacity-0";
/** fade in */
export const FADE = "transition-opacity duration-500 motion-reduce:transition-none starting:opacity-0";

/** An SVG line that draws itself from its start when mounted. */
export function Draw({
  d,
  delay = 0,
  ms = 600,
  strokeWidth = 1.5,
  className = "",
}: {
  d: string;
  delay?: number;
  ms?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <path
      d={d}
      pathLength={1}
      strokeDasharray="1 2"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${ms}ms` }}
      className={`pointer-events-none fill-none [stroke-dashoffset:0] transition-[stroke-dashoffset] ease-out motion-reduce:transition-none starting:[stroke-dashoffset:1] ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Playback.

/** Count up to `max`, one step per `ms`, whenever `on` — for scenes that play by themselves. */
export function useCountUp(max: number, ms: number, on = true) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!on || k >= max) return;
    const t = setTimeout(() => setK(k + 1), ms);
    return () => clearTimeout(t);
  }, [on, k, max, ms]);
  return k;
}

/**
 * Play a counter from `from` up to `end`, one step per `ms`, when asked.
 * `done` fires on the last step, from the timer (never from render).
 */
export function usePlay(ms: number) {
  const [k, setK] = useState(0);
  const [to, setTo] = useState(0);
  const onDone = useRef<(() => void) | null>(null);
  const running = k < to;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setK(k + 1);
      if (k + 1 === to) onDone.current?.();
    }, ms);
    return () => clearTimeout(t);
  }, [running, k, to, ms]);

  const play = (end: number, done?: () => void, from = 0) => {
    setK(from);
    setTo(end);
    onDone.current = done ?? null;
  };
  return { k, running, play };
}

/**
 * Glide a few numbers to new values, eased, whenever they change, so a shape
 * grows, shrinks and widens instead of jumping. `start` makes it rise from
 * somewhere else on mount. Reduced motion jumps straight there.
 */
export function useTween(target: number[], ms: number, start?: number[]): number[] {
  const key = target.join(" ");
  const [now, setNow] = useState(start ?? target);
  const at = useRef(start ?? target);
  useEffect(() => {
    const to = key.split(" ").map(Number);
    const from = at.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = calm ? 1 : Math.min(1, (t - t0) / ms);
      const e = 1 - (1 - p) ** 3;
      const next = to.map((b, i) => from[i] + (b - from[i]) * e);
      at.current = next;
      setNow(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, ms]);
  return now;
}

// ---------------------------------------------------------------------------
// Chrome.

const TINT = {
  blue: { face: "bg-cat-blue/15 text-cat-blue", plain: "bg-cat-blue/10" },
  teal: { face: "bg-cat-teal/15 text-cat-teal", plain: "bg-cat-teal/10" },
};

/** A character talking back, as a chat bubble under the stage. */
export function Speech({
  who,
  initial,
  tint = "blue",
  tone = "plain",
  children,
}: {
  who: string;
  initial: string;
  tint?: keyof typeof TINT;
  tone?: "plain" | "good" | "bad";
  children: ReactNode;
}) {
  return (
    <div className="mt-3 flex items-start gap-2.5 transition duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
      <span
        aria-hidden="true"
        className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${TINT[tint].face}`}
      >
        {initial}
      </span>
      <div
        className={`rounded-2xl rounded-tl-sm px-3.5 py-2 text-[0.95rem] leading-snug ${
          tone === "good" ? "bg-accent/10 text-accent-text" : tone === "bad" ? "bg-danger/10 text-danger" : TINT[tint].plain
        }`}
      >
        <b className="font-semibold">{who}:</b> {children}
      </div>
    </div>
  );
}

/** A "not quite" line under the stage; key it so it re-animates per miss. */
export function Nope({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 text-[0.95rem] text-danger transition duration-300 motion-reduce:transition-none starting:-translate-y-1 starting:opacity-0">
      {children}
    </div>
  );
}

export type Look = "idle" | "picked" | "right" | "wrong" | "dim";
export const LOOK: Record<Look, string> = {
  idle: "border-border hover:border-cat-blue/60",
  picked: "border-cat-blue bg-cat-blue/10",
  right: "win-pop border-accent bg-accent text-accent-foreground",
  wrong: "nudge border-danger/50 bg-danger/5 text-danger",
  dim: "border-border opacity-50",
};

/** How an option looks in a predict-then-watch question. */
export const predictLook = (i: number, guess: number | null, over: boolean, answer: number): Look =>
  over && i === answer ? "right" : over && i === guess ? "wrong" : i === guess ? "picked" : guess !== null ? "dim" : "idle";

export function Choice({
  n,
  look,
  disabled,
  onClick,
  children,
}: {
  n: number;
  look: Look;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default ${LOOK[look]}`}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-current/30 text-sm font-semibold">
        {look === "right" ? "✓" : look === "wrong" ? "✕" : String.fromCharCode(65 + n)}
      </span>
      <span className="min-w-0">{children}</span>
    </button>
  );
}

/** Small sub-goals of one screen, each ticked as it is met. */
export function Ticks({ items }: { items: [label: string, done: boolean][] }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {items.map(([label, done]) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors duration-300 ${
            done ? "win-pop border-accent/50 bg-accent/10 text-accent-text" : "border-border text-muted"
          }`}
        >
          <span
            aria-hidden="true"
            className={`grid size-4 place-items-center rounded-full text-[0.65rem] font-bold ${
              done ? "bg-accent text-accent-foreground" : "border border-muted/50"
            }`}
          >
            {done ? "✓" : ""}
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}

export const primaryBtn =
  "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-cat-blue px-5 font-semibold text-white transition-all hover:-translate-y-px disabled:cursor-default disabled:opacity-40 disabled:hover:translate-y-0";
export const quietBtn =
  "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-cat-blue px-5 font-semibold text-cat-blue transition-colors hover:bg-cat-blue/10 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";
export const pill = (on: boolean) =>
  `cursor-pointer rounded-full border-2 px-3.5 py-1.5 font-mono text-sm font-semibold transition-colors ${
    on ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
  }`;

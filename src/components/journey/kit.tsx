"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { bn } from "@/components/interactive/figure-kit";

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
      // A number with no previous value (the list grew) starts where it is.
      const next = to.map((b, i) => (from[i] === undefined ? b : from[i] + (b - from[i]) * e));
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
// Scenes: a figure that acts out what the words describe, in beats 1…steps.
//
// A scene never starts by itself. It waits on its first frame with two ways
// in: "একবারে দেখুন" plays every beat on a timer (one per `ms`, or `ms[k]`
// before beat k + 1), and "step by step" lets the reader walk the beats with
// আগের / পরের at their own pace (tapping it mid-play takes over from there).
// Reduced motion opens on the last beat; a preview (`npm run shot`) does too,
// unless its seed sets `k`.

/**
 * `k` = beats shown so far, 0…steps. `play()` runs it from the start,
 * `step(±1)` moves one beat by hand. Put it in a <Scene> or a cast
 * <StoryFrame>, which draw the controls.
 */
export function useScene(steps: number, ms: number | readonly number[]) {
  const [k, setK] = useSeed("k", useContext(SeedCtx) ? steps : 0);
  const [on, setOn] = useState(false);
  const [stepping, setStepping] = useSeed("stepping", false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setK(steps);
  }, [steps, setK]);

  const wait = typeof ms === "number" ? ms : (ms[k] ?? ms[ms.length - 1]);
  useEffect(() => {
    if (!on || k >= steps) return;
    const t = setTimeout(() => setK(k + 1), wait);
    return () => clearTimeout(t);
  }, [on, k, steps, wait, setK]);

  /** every beat from the start, on the timer */
  const play = () => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStepping(false);
    setK(calm ? steps : 0);
    setOn(!calm);
  };
  /** one beat back or forward by hand; stops the timer */
  const step = (d: 1 | -1) => {
    setOn(false);
    setStepping(true);
    setK(Math.min(steps, Math.max(0, k + d)));
  };
  /** switch to walking it by hand: from where it is if it is part-way, else from beat 1 */
  const byHand = () => {
    setOn(false);
    setStepping(true);
    setK(k > 0 && k < steps ? k : 1);
  };
  return { k, steps, done: k >= steps, playing: on && k < steps, stepping, play, replay: play, step, byHand };
}

export type SceneState = ReturnType<typeof useScene>;

const ctlBtn =
  "cursor-pointer rounded-full px-3 py-1 text-sm font-semibold transition-colors duration-200 disabled:cursor-default disabled:opacity-35 motion-reduce:transition-none";
const ctlMain = `${ctlBtn} bg-cat-blue text-white hover:bg-cat-blue/85`;
const ctlQuiet = `${ctlBtn} border border-border text-foreground hover:border-cat-blue/60 hover:bg-cat-blue/5`;

/**
 * The two ways to watch a scene. Before and after a run: "একবারে দেখুন" (or
 * "আবার দেখুন") and "step by step". While stepping: আগের, where it is, পরের,
 * and a way back to watching it all.
 */
export function SceneControls({ scene: { k, steps, done, playing, stepping, play, step, byHand } }: { scene: SceneState }) {
  if (stepping)
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <button type="button" onClick={() => step(-1)} disabled={k <= 0} className={ctlQuiet} aria-label="আগের ধাপ">
          ← আগের
        </button>
        <span className="min-w-12 text-center text-sm text-muted tabular-nums" aria-live="polite">
          {bn(k)} / {bn(steps)}
        </span>
        <button type="button" onClick={() => step(1)} disabled={done} className={ctlMain} aria-label="পরের ধাপ">
          পরের →
        </button>
        <button type="button" onClick={play} className="cursor-pointer px-1.5 text-sm text-muted underline-offset-2 hover:text-foreground hover:underline">
          একবারে দেখুন
        </button>
      </div>
    );
  return (
    <div className="flex items-center justify-center gap-2">
      {playing ? (
        <span className="text-sm text-muted tabular-nums">
          চলছে… {bn(k)} / {bn(steps)}
        </span>
      ) : (
        <button type="button" onClick={play} className={ctlMain}>
          {done ? "আবার দেখুন" : "একবারে দেখুন"}
        </button>
      )}
      <button type="button" onClick={byHand} className={ctlQuiet}>
        step by step
      </button>
    </div>
  );
}

/**
 * How much a scene's drawing grows on a bigger screen. A figure is drawn for a
 * phone (≤ ~260px tall); a tablet or laptop has more room, so the drawing is
 * zoomed, never the caption or the controls. Each step needs the height as well
 * as the width, because the Journey is one screen tall: a short laptop or a
 * phone on its side stays at ×1 rather than push the words off the screen.
 * Class strings stay literal so Tailwind sees them. Sizes are in rem with the
 * same digit count (40/48/64/80rem = 640/768/1024/1280px): Tailwind sorts these
 * variants as text, and when several steps match, the last one wins, so the
 * text order must be the size order ("1024px" would sort before "640px").
 */
export const GROW =
  "[@media(min-width:40rem)_and_(min-height:40rem)]:[zoom:1.2] [@media(min-width:48rem)_and_(min-height:47.5rem)]:[zoom:1.35] [@media(min-width:64rem)_and_(min-height:53.75rem)]:[zoom:1.5] [@media(min-width:80rem)_and_(min-height:62.5rem)]:[zoom:1.7]";
/**
 * The same idea for a step's widget, which is taller than a figure (up to
 * ~460px on a phone) and must still fit one screen with its Task and Continue,
 * so it grows less and needs more height for each step. A wrapper whose direct
 * child says `data-nogrow` (the review Check: big text, nothing to see) stays ×1.
 */
export const GROW_WIDGET =
  "[@media(min-width:40rem)_and_(min-height:48.75rem)]:[zoom:1.15] [@media(min-width:48rem)_and_(min-height:56.25rem)]:[zoom:1.3] [@media(min-width:64rem)_and_(min-height:65rem)]:[zoom:1.45] has-[>[data-nogrow]]:[zoom:1]!";
/** The same steps as widths, for a frame that scales by width alone (a cast Stage is an SVG). */
export const GROW_WIDE =
  "max-w-[22rem] [@media(min-width:40rem)_and_(min-height:40rem)]:max-w-[26.4rem] [@media(min-width:48rem)_and_(min-height:47.5rem)]:max-w-[29.7rem] [@media(min-width:64rem)_and_(min-height:53.75rem)]:max-w-[33rem] [@media(min-width:80rem)_and_(min-height:62.5rem)]:max-w-[37.4rem]";

/**
 * The frame for a scene: the drawing, a caption under it (what to look at, or
 * what this beat says), and the controls to watch it all or step through it.
 * The drawing grows on bigger screens (GROW); the words and buttons don't.
 */
export function Scene({ scene, caption, children }: { scene: SceneState; caption?: ReactNode; children: ReactNode }) {
  return (
    <div className="my-4 rounded-2xl border border-border bg-foreground/[0.02] px-3 pt-3 pb-2.5">
      <div className={GROW}>{children}</div>
      {caption ? <div className="mx-auto mt-2 min-h-10 max-w-xs text-center text-sm leading-snug text-muted sm:max-w-md">{caption}</div> : null}
      <div className="mt-2">
        <SceneControls scene={scene} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview seeds. `npm run shot` renders a screen in a named state by handing
// its useSeed() calls their starting values; anywhere else each one falls back
// to its own initial value, so a screen behaves exactly as with useState.

export type Seed = Record<string, unknown>;
/** a file's named screen states for `npm run shot`: { Screen: { state: seed } } */
export type Fixtures = Record<string, Record<string, Seed>>;
const SeedCtx = createContext<Seed | null>(null);
export const SeedProvider = SeedCtx.Provider;

/** useState whose starting value a preview can set, by `key`. */
export function useSeed<T>(key: string, initial: T) {
  const seed = useContext(SeedCtx);
  return useState<T>(seed && key in seed ? (seed[key] as T) : initial);
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
      className={`flex w-full cursor-pointer items-center rounded-xl border-2 text-left transition-[color,background-color,border-color,opacity,padding] duration-200 disabled:cursor-default ${
        // Passed over once the guess is in: a compact line, so the figure the guess
        // reveals below still fits the screen with its controls.
        look === "dim" ? "gap-2 px-3 py-1 text-sm" : "gap-3 px-4 py-2.5"
      } ${LOOK[look]}`}
    >
      <span
        className={`grid shrink-0 place-items-center rounded-lg border border-current/30 font-semibold ${look === "dim" ? "size-5 text-xs" : "size-7 text-sm"}`}
      >
        {look === "right" ? "✓" : look === "wrong" ? "✕" : String.fromCharCode(65 + n)}
      </span>
      <span className="min-w-0">{children}</span>
    </button>
  );
}

/**
 * Small sub-goals of one screen, each ticked as it is met. Plain text with a
 * tick, no border: they report progress and must not pass for buttons.
 */
export function Ticks({ items }: { items: [label: string, done: boolean][] }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-3.5 gap-y-1">
      {items.map(([label, done]) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1.5 text-sm transition-colors duration-300 motion-reduce:transition-none ${
            done ? "win-pop text-accent-text" : "text-muted"
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

/** A number the reader dials up and down; a vector entry, so ASCII digits and a real minus. */
export function Stepper({
  value,
  onChange,
  min,
  max,
  disabled = false,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  label: string;
}) {
  const btn =
    "grid size-8 cursor-pointer place-items-center rounded-full text-lg font-bold text-muted transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 font-mono">
      <button type="button" aria-label={`${label} এক কম`} className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-9 text-center text-lg font-semibold tabular-nums">{value < 0 ? `−${-value}` : value}</span>
      <button type="button" aria-label={`${label} এক বেশি`} className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// A laptop screen, for scenes where a program runs. Dark in both themes, so
// its ink is fixed.

export function Laptop({ file = "class.csv", children }: { file?: string; children: ReactNode }) {
  return (
    <div
      className="w-full max-w-[15.5rem] shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-black/20"
      style={{ backgroundColor: "#0f172a", color: "#e2e8f0" }}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ backgroundColor: "#1e293b" }}>
        {["#f87171", "#fbbf24", "#34d399"].map((c) => (
          <i key={c} className="size-2 rounded-full" style={{ backgroundColor: c }} />
        ))}
        <span className="ml-1.5 font-mono text-xs" style={{ color: "#94a3b8" }}>
          {file}
        </span>
      </div>
      <div className="px-2 py-2 text-[0.9rem] leading-relaxed">{children}</div>
    </div>
  );
}

/** A line the program prints, on a Laptop. */
export function Out({ tone = "dim", children }: { tone?: "dim" | "ok" | "bad" | "plain"; children: ReactNode }) {
  const color = { dim: "#94a3b8", ok: "#6ee7b7", bad: "#fca5a5", plain: "#e2e8f0" }[tone];
  return (
    <div className={`${FADE} px-2 font-mono text-[0.8rem] leading-relaxed`} style={{ color }}>
      {children}
    </div>
  );
}

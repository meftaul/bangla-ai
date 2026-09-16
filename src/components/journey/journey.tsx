"use client";

import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { bn } from "@/components/interactive/figure-kit";

// A lesson told one screen at a time, Brilliant-style.
//
//   <Journey title="…">
//     <Step> words + one interactive visual </Step>
//     <Step> … </Step>
//   </Journey>
//
// Only the current screen is mounted, so every screen's entrance animation plays
// fresh when the reader arrives. A screen can hold the reader until they have
// actually done the thing it asks: any component inside it that calls useGate()
// locks the Continue arrow until it calls the returned pass(). Screens with no
// gate are free to skip. A screen the reader has already cleared stays cleared
// when they come back to it.
//
// ponytail: progress lives in memory, so a reload starts from screen 1. Persist
// { at, furthest } per user (Supabase) or per browser if lessons grow long.
//
// Styling is Tailwind only. Note this renders inside the page's `.article`
// wrapper, whose unlayered `p`/`h1`/`h2` rules beat layered utilities — so the
// chrome here uses divs and spans, not paragraphs and headings.

type GateApi = {
  register: (id: string) => () => void;
  pass: (id: string, note?: ReactNode) => void;
};

const GateCtx = createContext<GateApi | null>(null);

/**
 * Lock the current screen until the reader does something.
 *
 * Returns `pass(note?)`: call it when the task is done. The note shows in the
 * feedback bar beside the Continue arrow. Outside a Journey this is a no-op, so
 * the same component still works dropped into a normal article.
 */
export function useGate() {
  const api = useContext(GateCtx);
  const id = useId();
  // Layout effect: the lock must be in place before the first paint, or Continue
  // flashes enabled for a frame on every screen that has a task.
  useLayoutEffect(() => api?.register(id), [api, id]);
  return useCallback((note?: ReactNode) => api?.pass(id, note), [api, id]);
}

/** One screen. Purely a marker — Journey decides which one is on stage. */
export function Step({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Journey({ title, children }: { title?: string; children: ReactNode }) {
  // MDX can leave newline strings between the <Step>s; they are not screens.
  const steps = Children.toArray(children).filter((c) => !(typeof c === "string" && !c.trim()));
  const last = steps.length - 1;

  const [at, setAt] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [gates, setGates] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [note, setNote] = useState<ReactNode>(null);
  const top = useRef<HTMLDivElement>(null);

  const register = useCallback((id: string) => {
    setGates((g) => [...g, id]);
    return () => setGates((g) => g.filter((x) => x !== id));
  }, []);
  const pass = useCallback((id: string, n?: ReactNode) => {
    setPassed((p) => (p.includes(id) ? p : [...p, id]));
    if (n) setNote(n);
  }, []);
  const api = useMemo(() => ({ register, pass }), [register, pass]);

  // Passed ids are kept apart from registered ones, so a gate that re-registers
  // (StrictMode, a re-run effect) cannot re-lock a task already done.
  const cleared = at < furthest || gates.every((g) => passed.includes(g));
  const reachable = (i: number) => i <= Math.max(furthest, cleared ? at + 1 : at);

  const go = (to: number) => {
    if (to < 0 || to > last || to === at || !reachable(to)) return;
    setDir(to > at ? 1 : -1);
    setFurthest((f) => Math.max(f, to));
    setAt(to);
    setPassed([]);
    setNote(null);
    // A long screen may have been scrolled; the next one starts at its top.
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 0) {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    }
  };

  // → / Enter to continue, ← to go back. A screen that wants the arrow keys for
  // itself (driving the robot) takes them first and calls preventDefault().
  // The listener is installed once and reads the newest `go` through a ref.
  const nav = useRef((d: number) => go(at + d));
  useEffect(() => {
    nav.current = (d) => go(at + d);
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable], [role=application]")) return;
      if (e.key === "ArrowRight" || (e.key === "Enter" && !t?.closest?.("button, a, [role=button]"))) nav.current(1);
      else if (e.key === "ArrowLeft") nav.current(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const locked = !cleared;

  return (
    <div ref={top} className="flex min-h-[36rem] scroll-mt-24 flex-col">
      {/* ---- header: back, segmented progress, counter ---------------------- */}
      {title ? (
        <div className="mb-3 text-xs font-semibold tracking-wider text-accent-text uppercase">{title}</div>
      ) : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="আগের ধাপ"
          onClick={() => go(at - 1)}
          disabled={at === 0}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:border-border"
        >
          <span aria-hidden="true">←</span>
        </button>
        <nav aria-label="ধাপগুলো" className="flex flex-1 gap-1">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`ধাপ ${bn(i + 1)}`}
              aria-current={i === at ? "step" : undefined}
              disabled={!reachable(i)}
              onClick={() => go(i)}
              className={`h-2 min-w-0 flex-1 cursor-pointer rounded-full transition-colors duration-500 disabled:cursor-default ${
                i < at || (i === at && cleared)
                  ? "bg-accent"
                  : i === at
                    ? "bg-accent/40"
                    : i <= furthest
                      ? "bg-accent/25"
                      : "bg-border"
              }`}
            />
          ))}
        </nav>
        <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
          {bn(at + 1)}/{bn(steps.length)}
        </span>
      </div>

      {/* ---- the screen ----------------------------------------------------- */}
      <GateCtx.Provider value={api}>
        <div
          key={at}
          className={`mt-6 flex-1 text-[1.07rem] leading-[1.75] transition duration-500 ease-out motion-reduce:transition-none [&>*:first-child]:mt-0! ${
            dir > 0 ? "starting:translate-x-10 starting:opacity-0" : "starting:-translate-x-10 starting:opacity-0"
          }`}
        >
          <ClearedCtx.Provider value={cleared}>{steps[at]}</ClearedCtx.Provider>
        </div>
      </GateCtx.Provider>

      {/* ---- footer: feedback + the Continue arrow ------------------------- */}
      <div className="sticky bottom-0 z-10 mt-8 flex items-center gap-3 border-t border-border bg-surface py-4">
        <div className="min-w-0 flex-1" aria-live="polite">
          {cleared && note ? (
            <div className="flex items-start gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm leading-snug font-medium text-accent-text transition duration-300 motion-reduce:transition-none starting:translate-y-2 starting:opacity-0">
              <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-accent text-xs text-accent-foreground">
                ✓
              </span>
              <span>{note}</span>
            </div>
          ) : locked ? (
            <span className="text-sm text-muted">কাজটা করলেই সামনে যাওয়া যাবে</span>
          ) : null}
        </div>
        {at < last ? (
          <button
            type="button"
            onClick={() => go(at + 1)}
            disabled={locked}
            className={`inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full px-6 text-base font-semibold transition-all duration-300 motion-reduce:transition-none ${
              locked
                ? "cursor-not-allowed bg-border text-muted"
                : "bg-accent text-accent-foreground shadow-lg shadow-accent/25 ring-4 ring-accent/20 hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            এগিয়ে যান <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(0)}
            className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border px-6 text-base font-semibold text-foreground transition-colors hover:border-accent"
          >
            <span aria-hidden="true">↺</span> আবার Start থেকে
          </button>
        )}
      </div>
    </div>
  );
}

/** Whether the screen on stage is done. True outside a Journey, so `Then` still shows in a plain article. */
const ClearedCtx = createContext(true);

/**
 * The words that belong after the task: what the reader just found, told as
 * story. Shown once the screen is cleared, so an explanation never gives away
 * the answer before they have played; a screen they come back to shows it at once.
 */
export function Then({ children }: { children: ReactNode }) {
  const cleared = useContext(ClearedCtx);
  if (!cleared) return null;
  return (
    <div className="mt-6 border-t border-border pt-5 transition duration-500 motion-reduce:transition-none starting:translate-y-3 starting:opacity-0">
      {children}
    </div>
  );
}

/** The one thing a screen asks the reader to do, ticked when done. */
export function Task({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <div
      className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[0.95rem] leading-snug transition-colors duration-300 ${
        done ? "border-accent/40 bg-accent/10" : "border-dashed border-muted/40"
      }`}
    >
      <span
        className={`mt-px grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-300 ${
          done ? "bg-accent text-accent-foreground" : "border-2 border-muted/50"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : ""}
      </span>
      <span>{children}</span>
    </div>
  );
}

/**
 * A multiple-choice check that lets the reader try again, Brilliant-style: a
 * wrong pick nudges and stays marked, the right one unlocks the screen and
 * reveals `children` (the explanation, a picture) underneath.
 */
export function Check({
  question,
  options,
  answer,
  hint,
  praise = "ঠিক ধরেছেন!",
  children,
}: {
  question: string;
  options: string[];
  answer: number;
  /** shown after the first wrong pick */
  hint?: ReactNode;
  praise?: ReactNode;
  children?: ReactNode;
}) {
  const pass = useGate();
  const [wrong, setWrong] = useState<number[]>([]);
  const [won, setWon] = useState(false);

  const choose = (i: number) => {
    if (won) return;
    if (i === answer) {
      setWon(true);
      pass(praise);
    } else setWrong((w) => (w.includes(i) ? w : [...w, i]));
  };

  return (
    <div className="mt-2">
      <div className="text-xl leading-snug font-semibold text-balance">{question}</div>
      <div className="mt-5 flex flex-col gap-2.5">
        {options.map((opt, i) => {
          const isWrong = wrong.includes(i);
          const isRight = won && i === answer;
          return (
            <button
              key={i}
              type="button"
              disabled={won || isWrong}
              onClick={() => choose(i)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default ${
                isRight
                  ? "win-pop border-accent bg-accent text-accent-foreground"
                  : isWrong
                    ? "nudge border-danger/50 bg-danger/5 text-danger"
                    : won
                      ? "border-border opacity-50"
                      : "border-border hover:border-accent hover:bg-accent/5"
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-current/30 text-sm font-semibold">
                {isRight ? "✓" : isWrong ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {!won && wrong.length > 0 && hint ? (
        <div className="mt-3 rounded-xl bg-cat-amber/10 px-3.5 py-2.5 text-[0.95rem] leading-snug transition duration-300 starting:opacity-0">
          <b className="font-semibold">একটা hint:</b> {hint}
        </div>
      ) : null}
      {won && children ? (
        <div className="mt-4 transition duration-500 motion-reduce:transition-none starting:translate-y-3 starting:opacity-0">
          {children}
        </div>
      ) : null}
    </div>
  );
}

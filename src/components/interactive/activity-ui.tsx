"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Shared visuals for live activities (quiz / poll / dragdrop): the join lobby, the
// 30s countdown, the results bar chart, and the calm reveal summary. Motion is the
// brand's "lively moment" — gated by prefers-reduced-motion (the globals.css block
// the .bar-in/.win-pop/.chip-in classes live in is skipped entirely under reduce),
// and the JS count-up below snaps instantly. Everything reads fine without motion.

export type Bar = { label: string; count: number; highlight?: boolean };

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(REDUCE_QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false, // server: assume motion, hydration corrects it
  );
}

// Tween a number toward `value` (ease-out-cubic). Returns `value` directly under
// reduced motion (instant snap). Drives the "votes climbing" feel on bars/meters.
function useCountUp(value: number, duration = 500) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  useEffect(() => {
    displayRef.current = display;
  });
  useEffect(() => {
    if (reduced) return;
    const from = displayRef.current;
    if (from === value) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);
  return reduced ? value : display;
}

function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value)}</>;
}

// Horizontal bars whose width animates as counts change (covers the poll's live
// real-time update for free). On reveal each bar grows in (staggered by --i) and the
// highlighted/correct bar gives a gentle pop with a soft accent glow.
export function BarChart({ bars }: { bars: Bar[] }) {
  const total = bars.reduce((a, b) => a + b.count, 0);
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {bars.map((b, i) => {
        const pct = total ? Math.round((b.count / total) * 100) : 0;
        return (
          <li
            key={i}
            style={{ "--i": i } as React.CSSProperties}
            className={`bar-in relative overflow-hidden rounded-xl border px-4 py-3 text-lg ${
              b.highlight ? "win-pop border-accent" : "border-border"
            }`}
          >
            {b.highlight && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-accent"
                style={{
                  boxShadow:
                    "0 10px 28px -14px color-mix(in oklab, var(--accent) 65%, transparent)",
                }}
              />
            )}
            <span
              aria-hidden
              className={`absolute inset-y-0 left-0 transition-[width] duration-500 ease-out ${
                b.highlight ? "bg-accent/30" : "bg-accent/15"
              }`}
              style={{ width: `${pct}%` }}
            />
            <span className="relative flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                {b.highlight && <span aria-hidden>✅</span>}
                {b.label}
              </span>
              <span className="text-sm text-muted tabular-nums">
                <CountUp value={b.count} /> · {pct}%
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// A circular countdown: the ring drains as the seconds run out, calmly turning to
// the danger hue and pulsing in the final stretch. Sized up for projector legibility.
export function Countdown({ seconds, total = 30 }: { seconds: number; total?: number }) {
  const pct = Math.max(0, Math.min(100, (seconds / total) * 100));
  const urgent = seconds <= 5;
  const ring = urgent ? "var(--danger)" : "var(--accent)";
  return (
    <div className="mt-6 flex justify-center" aria-live="polite">
      <div
        className={`grid h-28 w-28 place-items-center rounded-full transition-colors sm:h-32 sm:w-32 ${
          urgent ? "animate-pulse" : ""
        }`}
        style={{ background: `conic-gradient(${ring} ${pct}%, var(--border) ${pct}%)` }}
      >
        <div className="grid h-[6.25rem] w-[6.25rem] place-items-center rounded-full bg-surface sm:h-28 sm:w-28">
          <span
            className={`text-4xl font-bold tabular-nums sm:text-5xl ${
              urgent ? "text-danger" : "text-foreground"
            }`}
          >
            {seconds}
          </span>
        </div>
      </div>
    </div>
  );
}

// Two-letter avatar from an email/name (e.g. "ada@x.com" -> "AD").
function initials(email: string) {
  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || email;
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

// Pre-start lobby. Quiz/DragDrop pass a participant `count` (big and playful); Poll
// omits it. Learner chips stream in as people join. The presenter sees the Start
// button; learners see "waiting". `question` previews what's coming.
export function IdleScreen({
  count,
  roster,
  question,
  label,
  presenter,
  onStart,
}: {
  count?: number;
  roster?: string[];
  question?: string;
  label: string;
  presenter: boolean;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-8 text-center">
      {question && (
        <p className="text-2xl font-semibold text-balance text-foreground">{question}</p>
      )}
      {count != null && (
        <div className="flex flex-col items-center gap-1">
          <span className="float-y text-7xl font-extrabold text-accent tabular-nums sm:text-8xl">
            <CountUp value={count} />
          </span>
          <span className="text-lg text-muted">
            {count === 1 ? "learner" : "learners"} joined ✨
          </span>
        </div>
      )}
      {roster && roster.length > 0 && (
        <ul className="flex max-w-md flex-wrap justify-center gap-2">
          {roster.map((email) => (
            <li
              key={email}
              title={email}
              className="chip-in grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-xs font-semibold text-muted"
            >
              {initials(email)}
            </li>
          ))}
        </ul>
      )}
      {presenter ? (
        <button type="button" onClick={onStart} className="btn-primary px-6 py-3 text-base">
          {label}
        </button>
      ) : (
        <p className="text-lg text-muted">Waiting for the teacher to start…</p>
      )}
    </div>
  );
}

// Presenter's live "responses coming in" meter: a count-up number over a filling
// bar. Shows momentum WITHOUT revealing the answer distribution (keeps a quiz fair).
export function AnsweredMeter({ answered, total }: { answered: number; total: number }) {
  const pct = total ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between text-base text-muted">
        <span className="tabular-nums">
          <span className="font-semibold text-foreground">
            <CountUp value={answered} />
          </span>{" "}
          / {total} answered
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-border">
        <span
          aria-hidden
          className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Calm reward line under the quiz/dragdrop results — the gentle moment, no confetti.
export function RevealSummary({ correct, total }: { correct: number; total: number }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <p className="mt-5 text-center text-base text-muted">
      <span className="font-semibold text-accent-text">
        <CountUp value={correct} />
      </span>{" "}
      of {total} got it right · {pct}% ✓
    </p>
  );
}

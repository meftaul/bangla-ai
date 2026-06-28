"use client";

// Shared visuals for live activities (quiz / poll / dragdrop): the pre-start
// screen, the 30s countdown, and the results bar chart. CSS-only motion, gated
// by prefers-reduced-motion in globals.css — everything reads fine without it.

export type Bar = { label: string; count: number; highlight?: boolean };

// Horizontal bars whose width animates as counts change (covers the poll's live
// real-time update for free via the width transition). Generalized from poll.tsx.
export function BarChart({ bars }: { bars: Bar[] }) {
  const total = bars.reduce((a, b) => a + b.count, 0);
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {bars.map((b, i) => {
        const pct = total ? Math.round((b.count / total) * 100) : 0;
        return (
          <li
            key={i}
            className={`relative overflow-hidden rounded-xl border px-4 py-3 text-lg ${
              b.highlight ? "border-accent" : "border-border"
            }`}
          >
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
                {b.count} · {pct}%
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// A circular countdown: the accent ring drains as the seconds run out, and the
// number pulses red in the final stretch.
export function Countdown({ seconds, total = 30 }: { seconds: number; total?: number }) {
  const pct = Math.max(0, Math.min(100, (seconds / total) * 100));
  const urgent = seconds <= 5;
  return (
    <div className="mt-6 flex justify-center" aria-live="polite">
      <div
        className={`grid h-28 w-28 place-items-center rounded-full ${urgent ? "animate-pulse" : ""}`}
        style={{ background: `conic-gradient(var(--accent) ${pct}%, var(--border) ${pct}%)` }}
      >
        <div className="grid h-[6.25rem] w-[6.25rem] place-items-center rounded-full bg-surface">
          <span
            className={`text-4xl font-bold tabular-nums ${urgent ? "text-danger" : "text-foreground"}`}
          >
            {seconds}
          </span>
        </div>
      </div>
    </div>
  );
}

// Pre-start screen. Quiz/DragDrop pass a participant `count` (big and playful);
// Poll omits it. The presenter sees the Start button; learners see "waiting".
export function IdleScreen({
  count,
  label,
  presenter,
  onStart,
}: {
  count?: number;
  label: string;
  presenter: boolean;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-8 text-center">
      {count != null && (
        <div className="flex flex-col items-center gap-1">
          <span className="float-y text-7xl font-extrabold text-accent tabular-nums sm:text-8xl">
            {count}
          </span>
          <span className="text-lg text-muted">
            {count === 1 ? "learner" : "learners"} joined ✨
          </span>
        </div>
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

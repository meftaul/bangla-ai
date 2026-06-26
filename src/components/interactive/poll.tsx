"use client";

import { useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";

// A poll: no right answer, shows a live tally. In a live session the bars fill as
// votes arrive (presenter sees all; a student sees votes since they joined). In a
// standalone article it just records the local pick.
export default function Poll({
  id,
  question,
  options,
}: {
  id?: string;
  question: string;
  options: string[];
}) {
  const live = useLiveActivity(id ?? question, "poll", null);
  const [picked, setPicked] = useState<number | null>(null);

  const isPresenter = live.mode === "presenter";
  const minePick = (live.mine?.response as { pick?: number } | undefined)?.pick ?? null;
  const chosen = minePick ?? picked;
  const showTally = live.mode !== "practice";
  const total = Object.values(live.polls).reduce((a, b) => a + b, 0);

  const choose = (i: number) => {
    if (isPresenter || live.recorded) return;
    setPicked(i);
    if (live.mode === "practice") return;
    live.submit({ pick: i, label: options[i] }, null);
  };

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-foreground">{question}</p>
      <ul className="mt-6 flex flex-col gap-3">
        {options.map((opt, i) => {
          const count = live.polls[i] ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const isChosen = chosen === i;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={isPresenter || live.recorded}
                onClick={() => choose(i)}
                className={`relative w-full overflow-hidden rounded-md border px-4 py-3 text-left text-lg transition-colors ${
                  isChosen ? "border-accent" : "border-border hover:border-accent"
                }`}
              >
                {showTally && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-accent/15"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <span className="relative flex justify-between gap-3">
                  <span>{opt}</span>
                  {showTally && (
                    <span className="text-sm text-muted">
                      {count} · {pct}%
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {live.recorded && <p className="mt-4 text-base text-muted">✓ Vote recorded</p>}
    </div>
  );
}

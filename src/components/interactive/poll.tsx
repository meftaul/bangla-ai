"use client";

import { useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";
import { BarChart, Countdown, IdleScreen } from "@/components/interactive/activity-ui";

// A poll: no right answer. In a live session the teacher starts it, learners vote
// during a 30s window, the presenter watches a live bar chart, and the final tally
// freezes on end. In a standalone article it just records the local pick.
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

  // Practice mode: unchanged standalone behavior (records the local pick, no tally).
  if (live.mode === "practice")
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-foreground">{question}</p>
        <ul className="mt-6 flex flex-col gap-3">
          {options.map((opt, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPicked(i)}
                className={`w-full rounded-md border px-4 py-3 text-left text-lg transition-colors ${
                  picked === i ? "border-accent" : "border-border hover:border-accent"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  // Live session (presenter / viewer).
  const isPresenter = live.mode === "presenter";
  const minePick = (live.mine?.response as { pick?: number } | undefined)?.pick ?? null;
  const chosen = minePick ?? picked;

  if (live.phase === "idle")
    return <IdleScreen label="Start Poll" presenter={isPresenter} onStart={live.start} />;

  // Presenter watches the live tally (and the frozen one after end).
  const presenterBars = options.map((opt, i) => ({ label: opt, count: live.polls[i] ?? 0 }));
  const finalBars = options.map((opt, i) => ({ label: opt, count: live.results?.[i] ?? 0 }));

  if (live.phase === "ended")
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-foreground">{question}</p>
        <BarChart bars={finalBars} />
      </div>
    );

  // Running.
  const choose = (i: number) => {
    if (live.recorded || isPresenter) return;
    setPicked(i);
    live.submit({ pick: i, label: options[i] }, null);
  };

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-foreground">{question}</p>
      {isPresenter ? (
        <BarChart bars={presenterBars} />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {options.map((opt, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={live.recorded}
                onClick={() => choose(i)}
                className={`w-full rounded-md border px-4 py-3 text-left text-lg transition-colors ${
                  chosen === i ? "border-accent" : "border-border hover:border-accent"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Countdown seconds={live.secondsLeft} />
      {live.recorded && !isPresenter && (
        <p className="mt-4 text-center text-base text-muted">✓ Vote recorded</p>
      )}
      {isPresenter && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-base text-muted">{live.answeredCount} voted</span>
          <button type="button" onClick={live.end} className="btn-secondary">
            End Poll
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";
import { BarChart, Countdown, IdleScreen } from "@/components/interactive/activity-ui";

// A poll: no right answer. In a live session the teacher starts it, learners vote
// during a 30s window and then watch the tally climb live (broadcasts cover every
// vote cast after they joined the lobby), and the final tally freezes on end. In a
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

  // Practice mode: unchanged standalone behavior (records the local pick, no tally).
  if (live.mode === "practice")
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-balance text-foreground">{question}</p>
        <OptionList options={options} chosen={picked} disabled={false} onChoose={setPicked} />
      </div>
    );

  // Live session (presenter / viewer).
  const isPresenter = live.mode === "presenter";
  const minePick = (live.mine?.response as { pick?: number } | undefined)?.pick ?? null;
  const chosen = minePick ?? picked;

  if (live.phase === "idle")
    return (
      <IdleScreen
        roster={live.roster}
        question={question}
        label="Start Poll"
        presenter={isPresenter}
        onStart={live.start}
      />
    );

  const liveBars = options.map((opt, i) => ({ label: opt, count: live.polls[i] ?? 0 }));
  const finalBars = options.map((opt, i) => ({ label: opt, count: live.results?.[i] ?? 0 }));

  if (live.phase === "ended")
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-balance text-foreground">{question}</p>
        <BarChart bars={finalBars} />
      </div>
    );

  // Running.
  const choose = (i: number) => {
    if (live.recorded || isPresenter) return;
    setPicked(i);
    live.submit({ pick: i, label: options[i] }, null);
  };

  // Presenter and learners-who-voted watch the live chart; learners yet to vote pick.
  const showChart = isPresenter || live.recorded;

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-balance text-foreground">{question}</p>
      {showChart ? (
        <BarChart bars={liveBars} />
      ) : (
        <OptionList options={options} chosen={chosen} disabled={false} onChoose={choose} />
      )}
      <Countdown seconds={live.secondsLeft} />
      {live.recorded && !isPresenter && (
        <p className="mt-4 text-center text-base text-muted">✓ Vote recorded</p>
      )}
      {isPresenter && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-base text-muted tabular-nums">{live.answeredCount} voted</span>
          <button type="button" onClick={live.end} className="btn-secondary">
            End Poll
          </button>
        </div>
      )}
    </div>
  );
}

// Vote options — same shape/badge as the quiz so the live vocabulary stays consistent,
// but only a selected state (no right/wrong).
function OptionList({
  options,
  chosen,
  disabled,
  onChoose,
}: {
  options: string[];
  chosen: number | null;
  disabled: boolean;
  onChoose: (i: number) => void;
}) {
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {options.map((opt, i) => (
        <li key={i}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChoose(i)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-lg transition-[color,background-color,border-color,transform] active:scale-[0.99] ${
              chosen === i ? "border-accent bg-accent/10" : "border-border hover:border-accent"
            }`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-current/30 text-sm font-semibold opacity-80">
              {String.fromCharCode(65 + i)}
            </span>
            <span>{opt}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

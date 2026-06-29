"use client";

import { useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";
import {
  AnsweredMeter,
  BarChart,
  Countdown,
  IdleScreen,
  RevealSummary,
} from "@/components/interactive/activity-ui";

// A stateful MCQ rendered live inside a reveal.js slide.
// - practice (standalone article): instant right/wrong feedback (original behavior).
// - live session: the teacher drives idle -> running (30s) -> ended; learners answer
//   only while running, the correct answer + a results bar chart reveal on end.
export default function Quiz({
  id,
  question,
  options,
  answer,
}: {
  id?: string;
  question: string;
  options: string[];
  answer: number; // index of the correct option
}) {
  // Register the correct answer with its label so the results page can show it.
  const live = useLiveActivity(id ?? question, "quiz", { index: answer, label: options[answer] });
  const [picked, setPicked] = useState<number | null>(null);

  // Practice mode: unchanged standalone behavior (instant feedback, no phases).
  if (live.mode === "practice") {
    const choose = (i: number) => setPicked(i);
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-balance text-foreground">{question}</p>
        <OptionList
          options={options}
          chosen={picked}
          revealed={picked !== null}
          answer={answer}
          disabled={picked !== null}
          onChoose={choose}
        />
        {picked !== null && (
          <p className="mt-4 text-base text-muted">
            {picked === answer ? "সঠিক! ✅ Correct." : "আবার চেষ্টা করো — wrong."}
          </p>
        )}
      </div>
    );
  }

  // Live session (presenter / viewer).
  const isPresenter = live.mode === "presenter";
  const minePick = (live.mine?.response as { pick?: number } | undefined)?.pick ?? null;
  const chosen = minePick ?? picked;
  const ended = live.phase === "ended";

  if (live.phase === "idle")
    return (
      <IdleScreen
        count={live.participantCount}
        roster={live.roster}
        question={question}
        label="Start Quiz"
        presenter={isPresenter}
        onStart={live.start}
      />
    );

  const choose = (i: number) => {
    if (live.phase !== "running" || live.recorded || isPresenter) return;
    setPicked(i);
    live.submit({ pick: i, label: options[i] }, i === answer);
  };

  // Learners expected to answer = everyone present minus the presenter.
  const expected = Math.max(live.answeredCount, live.participantCount - 1);
  const totalCorrect = live.results?.[answer] ?? 0;
  const totalResponses = (live.results ?? []).reduce((a, c) => a + c, 0);

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-balance text-foreground">{question}</p>
      <OptionList
        options={options}
        chosen={chosen}
        revealed={ended}
        answer={answer}
        disabled={isPresenter || live.recorded || ended}
        onChoose={choose}
      />

      {live.phase === "running" && (
        <>
          {isPresenter ? (
            <>
              <AnsweredMeter answered={live.answeredCount} total={expected} />
              <Countdown seconds={live.secondsLeft} />
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={live.end} className="btn-secondary">
                  End Quiz
                </button>
              </div>
            </>
          ) : (
            <>
              <Countdown seconds={live.secondsLeft} />
              {live.recorded && (
                <p className="mt-4 text-center text-base text-muted">✓ Answer recorded</p>
              )}
            </>
          )}
        </>
      )}

      {ended && (
        <>
          <BarChart
            bars={options.map((opt, i) => ({
              label: opt,
              count: live.results?.[i] ?? 0,
              highlight: i === answer,
            }))}
          />
          <RevealSummary correct={totalCorrect} total={totalResponses} />
        </>
      )}
    </div>
  );
}

// Shared option list for practice + live. A letter badge (A/B/C…) lets phone viewers
// match their choice to the projected slide. On reveal the correct option pops, the
// learner's wrong pick nudges.
function OptionList({
  options,
  chosen,
  revealed,
  answer,
  disabled,
  onChoose,
}: {
  options: string[];
  chosen: number | null;
  revealed: boolean;
  answer: number;
  disabled: boolean;
  onChoose: (i: number) => void;
}) {
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {options.map((opt, i) => {
        const isChosen = chosen === i;
        const isCorrect = i === answer;
        const state = revealed
          ? isCorrect
            ? "border-accent bg-accent text-accent-foreground win-pop"
            : isChosen
              ? "border-danger bg-danger/10 text-danger nudge"
              : "border-border opacity-60"
          : isChosen
            ? "border-accent bg-accent/10"
            : "border-border hover:border-accent";
        return (
          <li key={i}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChoose(i)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-lg transition-[color,background-color,border-color,transform] active:scale-[0.99] disabled:active:scale-100 ${state}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-current/30 text-sm font-semibold opacity-80">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

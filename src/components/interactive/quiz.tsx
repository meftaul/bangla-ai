"use client";

import { useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";
import { BarChart, Countdown, IdleScreen } from "@/components/interactive/activity-ui";

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
        <p className="text-2xl font-semibold text-foreground">{question}</p>
        <ul className="mt-6 flex flex-col gap-3">
          {options.map((opt, i) => {
            const isChosen = picked === i;
            const isCorrect = i === answer;
            const state =
              picked !== null
                ? isCorrect
                  ? "border-accent bg-accent text-accent-foreground"
                  : isChosen
                    ? "border-danger bg-danger/10 text-danger"
                    : "border-border opacity-60"
                : "border-border hover:border-accent";
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-lg transition-colors ${state}`}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
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

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-foreground">{question}</p>
      <ul className="mt-6 flex flex-col gap-3">
        {options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = i === answer;
          const state = ended
            ? isCorrect
              ? "border-accent bg-accent text-accent-foreground"
              : isChosen
                ? "border-danger bg-danger/10 text-danger"
                : "border-border opacity-60"
            : isChosen
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent";
          return (
            <li key={i}>
              <button
                type="button"
                disabled={isPresenter || live.recorded || ended}
                onClick={() => choose(i)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-lg transition-colors ${state}`}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>

      {live.phase === "running" && (
        <>
          <Countdown seconds={live.secondsLeft} />
          {live.recorded && !isPresenter && (
            <p className="mt-4 text-center text-base text-muted">✓ Answer recorded</p>
          )}
          {isPresenter && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-base text-muted">{live.answeredCount} answered</span>
              <button type="button" onClick={live.end} className="btn-secondary">
                End Quiz
              </button>
            </div>
          )}
        </>
      )}

      {ended && (
        <BarChart
          bars={options.map((opt, i) => ({
            label: opt,
            count: live.results?.[i] ?? 0,
            highlight: i === answer,
          }))}
        />
      )}
    </div>
  );
}

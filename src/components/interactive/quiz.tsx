"use client";

import { useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";

// A stateful MCQ rendered live inside a reveal.js slide. Renders in three modes:
// - practice  (standalone article): instant right/wrong feedback (original behavior)
// - viewer    (live session):       locks the answer, NO correctness shown until after
// - presenter (live session):       static, shows how many students have answered
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

  const isPresenter = live.mode === "presenter";
  const reveal = live.mode === "practice"; // only practice shows correctness live
  // In a live session, the locked pick comes from the server (survives refresh).
  const minePick = (live.mine?.response as { pick?: number } | undefined)?.pick ?? null;
  const chosen = live.mode === "practice" ? picked : minePick ?? picked;
  const locked = isPresenter || live.recorded;

  const choose = (i: number) => {
    if (live.mode === "practice") return setPicked(i);
    if (live.recorded) return;
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
          const state =
            reveal && chosen !== null
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
                disabled={locked && !isPresenter}
                onClick={() => choose(i)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-lg transition-colors ${state}`}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
      {reveal && chosen !== null && (
        <p className="mt-4 text-base text-muted">
          {chosen === answer ? "সঠিক! ✅ Correct." : "আবার চেষ্টা করো — wrong."}
        </p>
      )}
      {live.recorded && !reveal && (
        <p className="mt-4 text-base text-muted">✓ Answer recorded</p>
      )}
      {isPresenter && (
        <p className="mt-4 text-base text-muted">{live.answeredCount} answered</p>
      )}
    </div>
  );
}

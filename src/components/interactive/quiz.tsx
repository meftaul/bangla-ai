"use client";

import { useState } from "react";

// Proof-of-concept interactive slide component: a stateful MCQ rendered live
// inside a reveal.js slide. Charts/visualizations follow this exact pattern.
export default function Quiz({
  question,
  options,
  answer,
}: {
  question: string;
  options: string[];
  answer: number; // index of the correct option
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-foreground">{question}</p>
      <ul className="mt-6 flex flex-col gap-3">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === answer;
          // Only color once the user has answered.
          const state =
            picked === null
              ? "border-border hover:border-accent"
              : isCorrect
                ? "border-accent bg-accent text-accent-foreground"
                : isPicked
                  ? "border-red-500 bg-red-500/10"
                  : "border-border opacity-60";
          return (
            <li key={i}>
              <button
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(i)}
                className={`w-full rounded-md border px-4 py-3 text-left text-lg transition-colors ${state}`}
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

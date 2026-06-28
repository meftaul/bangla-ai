"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";
import { BarChart, Countdown, IdleScreen } from "@/components/interactive/activity-ui";

// Order the items correctly by dragging. `items` is the CORRECT order; the student
// sees them shuffled. All-or-nothing grading. Native HTML5 drag-and-drop, no library.
// In a live session the teacher drives idle -> running (30s) -> ended; the results
// chart shows a right/wrong split. ponytail: HTML5 DnD has weak touch support —
// add tap-to-place if run on phones.
export default function DragDrop({
  id,
  prompt,
  items,
}: {
  id?: string;
  prompt: string;
  items: string[];
}) {
  const live = useLiveActivity(id ?? prompt, "dragdrop", items);
  const isPresenter = live.mode === "presenter";

  // Presenter shows the answer; everyone else starts shuffled. Shuffle runs in an
  // effect (not the initializer) so SSR and first client render match — else hydration
  // mismatches on the random order.
  const [order, setOrder] = useState<string[]>(items);
  useEffect(() => {
    if (!isPresenter) setOrder(shuffle(items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const mineOrder = (live.mine?.response as { order?: string[] } | undefined)?.order;
  const shown = mineOrder ?? order;

  const move = (from: number, to: number) =>
    setOrder((o) => {
      const a = [...o];
      const [x] = a.splice(from, 1);
      a.splice(to, 0, x);
      return a;
    });

  // Practice mode: unchanged standalone behavior (instant right/wrong on submit).
  if (live.mode === "practice") {
    const locked = submitted;
    const correct = JSON.stringify(shown) === JSON.stringify(items);
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-foreground">{prompt}</p>
        <ItemList shown={shown} locked={locked} dragIndex={dragIndex} move={move} />
        {!submitted && (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="mt-4 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent"
          >
            Submit order
          </button>
        )}
        {submitted && (
          <p className="mt-4 text-base text-muted">
            {correct ? "সঠিক! ✅ Correct order." : "ভুল ক্রম — wrong order."}
          </p>
        )}
      </div>
    );
  }

  // Live session (presenter / viewer).
  if (live.phase === "idle")
    return (
      <IdleScreen
        count={live.participantCount}
        label="Start Activity"
        presenter={isPresenter}
        onStart={live.start}
      />
    );

  if (live.phase === "ended")
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-foreground">{prompt}</p>
        <p className="mt-4 text-base text-muted">Correct order: {items.join(" → ")}</p>
        <BarChart
          bars={[
            { label: "Got it right", count: live.results?.[0] ?? 0, highlight: true },
            { label: "Got it wrong", count: live.results?.[1] ?? 0 },
          ]}
        />
      </div>
    );

  // Running.
  const locked = isPresenter || live.recorded || submitted;
  const submit = () => {
    if (live.phase !== "running" || live.recorded) return;
    setSubmitted(true);
    live.submit({ order }, JSON.stringify(order) === JSON.stringify(items));
  };

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-foreground">{prompt}</p>
      <ItemList shown={shown} locked={locked} dragIndex={dragIndex} move={move} />
      <Countdown seconds={live.secondsLeft} />
      {!isPresenter && !live.recorded && !submitted && (
        <button
          type="button"
          onClick={submit}
          className="mt-4 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent"
        >
          Submit order
        </button>
      )}
      {live.recorded && !isPresenter && (
        <p className="mt-4 text-center text-base text-muted">✓ Answer recorded</p>
      )}
      {isPresenter && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-base text-muted">{live.answeredCount} answered</span>
          <button type="button" onClick={live.end} className="btn-secondary">
            End Activity
          </button>
        </div>
      )}
    </div>
  );
}

function ItemList({
  shown,
  locked,
  dragIndex,
  move,
}: {
  shown: string[];
  locked: boolean;
  dragIndex: React.RefObject<number | null>;
  move: (from: number, to: number) => void;
}) {
  return (
    <ul className="mt-6 flex flex-col gap-2">
      {shown.map((label, i) => (
        <li
          key={label}
          draggable={!locked}
          onDragStart={() => (dragIndex.current = i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex.current !== null) move(dragIndex.current, i);
            dragIndex.current = null;
          }}
          className={`rounded-md border px-4 py-3 text-lg ${
            locked ? "border-border opacity-90" : "cursor-grab border-border hover:border-accent"
          }`}
        >
          <span className="mr-2 text-muted">⠿</span>
          {label}
        </li>
      ))}
    </ul>
  );
}

function shuffle(a: string[]): string[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  // Avoid handing back the exact correct order for short lists.
  return r.length > 1 && JSON.stringify(r) === JSON.stringify(a) ? shuffle(a) : r;
}

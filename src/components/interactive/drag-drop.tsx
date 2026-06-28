"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";

// Order the items correctly by dragging. `items` is the CORRECT order; the student
// sees them shuffled. All-or-nothing grading. Native HTML5 drag-and-drop, no library.
// ponytail: HTML5 DnD has weak touch support — add tap-to-place if run on phones.
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
  const locked = isPresenter || live.recorded || submitted;
  const reveal = live.mode === "practice" && (submitted || live.recorded);
  const correct = JSON.stringify(shown) === JSON.stringify(items);

  const move = (from: number, to: number) =>
    setOrder((o) => {
      const a = [...o];
      const [x] = a.splice(from, 1);
      a.splice(to, 0, x);
      return a;
    });

  const submit = () => {
    setSubmitted(true);
    if (live.mode === "practice") return;
    live.submit({ order }, JSON.stringify(order) === JSON.stringify(items));
  };

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-foreground">{prompt}</p>
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
      {!isPresenter && !live.recorded && !submitted && (
        <button
          type="button"
          onClick={submit}
          className="mt-4 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent"
        >
          Submit order
        </button>
      )}
      {reveal && (
        <p className="mt-4 text-base text-muted">
          {correct ? "সঠিক! ✅ Correct order." : "ভুল ক্রম — wrong order."}
        </p>
      )}
      {live.recorded && live.mode !== "practice" && (
        <p className="mt-4 text-base text-muted">✓ Answer recorded</p>
      )}
      {isPresenter && <p className="mt-4 text-base text-muted">{live.answeredCount} answered</p>}
    </div>
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

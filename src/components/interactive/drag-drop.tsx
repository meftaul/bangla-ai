"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveActivity } from "@/components/live/session-context";
import { BarChart, Countdown, IdleScreen, RevealSummary } from "@/components/interactive/activity-ui";

// Order the items correctly by dragging. `items` is the CORRECT order; the student
// sees them shuffled. All-or-nothing grading. Native HTML5 drag-and-drop, no library.
// In a live session the teacher drives idle -> running (30s) -> ended; the results
// chart shows a right/wrong split and each learner sees their order marked per slot.
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
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const mineOrder = (live.mine?.response as { order?: string[] } | undefined)?.order;
  const shown = mineOrder ?? order;

  const move = (from: number, to: number) =>
    setOrder((o) => {
      const a = [...o];
      const [x] = a.splice(from, 1);
      a.splice(to, 0, x);
      return a;
    });

  const dndProps = {
    dragIndex,
    dragging,
    over,
    move,
    onDragState: setDragging,
    onOver: setOver,
  };

  // Practice mode: unchanged standalone behavior (instant right/wrong on submit).
  if (live.mode === "practice") {
    const locked = submitted;
    const correct = JSON.stringify(shown) === JSON.stringify(items);
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-balance text-foreground">{prompt}</p>
        <ItemList shown={shown} locked={locked} {...dndProps} />
        {!submitted && (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="btn-primary mt-4"
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
        roster={live.roster}
        question={prompt}
        label="Start Activity"
        presenter={isPresenter}
        onStart={live.start}
      />
    );

  if (live.phase === "ended") {
    const right = live.results?.[0] ?? 0;
    const wrong = live.results?.[1] ?? 0;
    return (
      <div className="mx-auto max-w-xl text-left">
        <p className="text-2xl font-semibold text-balance text-foreground">{prompt}</p>
        {/* Each learner sees their own order marked slot-by-slot against the answer. */}
        {mineOrder && <PerSlotReveal mine={mineOrder} correct={items} />}
        <p className="mt-4 text-sm text-muted">
          Correct order: <span className="text-foreground">{items.join(" → ")}</span>
        </p>
        <BarChart
          bars={[
            { label: "Got it right", count: right, highlight: true },
            { label: "Got it wrong", count: wrong },
          ]}
        />
        <RevealSummary correct={right} total={right + wrong} />
      </div>
    );
  }

  // Running.
  const locked = isPresenter || live.recorded || submitted;
  const submit = () => {
    if (live.phase !== "running" || live.recorded) return;
    setSubmitted(true);
    live.submit({ order }, JSON.stringify(order) === JSON.stringify(items));
  };

  return (
    <div className="mx-auto max-w-xl text-left">
      <p className="text-2xl font-semibold text-balance text-foreground">{prompt}</p>
      <ItemList shown={shown} locked={locked} {...dndProps} />
      <Countdown seconds={live.secondsLeft} />
      {!isPresenter && !live.recorded && !submitted && (
        <button type="button" onClick={submit} className="btn-primary mt-4">
          Submit order
        </button>
      )}
      {live.recorded && !isPresenter && (
        <p className="mt-4 text-center text-base text-muted">✓ Answer recorded</p>
      )}
      {isPresenter && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-base text-muted tabular-nums">{live.answeredCount} answered</span>
          <button type="button" onClick={live.end} className="btn-secondary">
            End Activity
          </button>
        </div>
      )}
    </div>
  );
}

// The learner's submitted order, each slot ✓ if it matches the answer, ✗ otherwise
// (with the correct item shown inline) — far more instructive than a pass/fail bar.
function PerSlotReveal({ mine, correct }: { mine: string[]; correct: string[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-2">
      {mine.map((label, i) => {
        const ok = label === correct[i];
        return (
          <li
            key={i}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-lg ${
              ok ? "border-accent bg-accent/10" : "border-danger bg-danger/10"
            }`}
          >
            <span aria-hidden className={ok ? "text-accent-text" : "text-danger"}>
              {ok ? "✓" : "✗"}
            </span>
            <span className="text-foreground">{label}</span>
            {!ok && <span className="ml-auto text-sm text-muted">→ {correct[i]}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function ItemList({
  shown,
  locked,
  dragIndex,
  dragging,
  over,
  move,
  onDragState,
  onOver,
}: {
  shown: string[];
  locked: boolean;
  dragIndex: React.RefObject<number | null>;
  dragging: number | null;
  over: number | null;
  move: (from: number, to: number) => void;
  onDragState: (i: number | null) => void;
  onOver: (i: number | null) => void;
}) {
  return (
    <ul className="mt-6 flex flex-col gap-2">
      {shown.map((label, i) => {
        const isDragging = dragging === i;
        const isOver = over === i && dragging !== i;
        return (
          <li
            key={label}
            draggable={!locked}
            onDragStart={() => {
              dragIndex.current = i;
              onDragState(i);
            }}
            onDragEnd={() => {
              onDragState(null);
              onOver(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              onOver(i);
            }}
            onDrop={() => {
              if (dragIndex.current !== null) move(dragIndex.current, i);
              dragIndex.current = null;
              onDragState(null);
              onOver(null);
            }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-lg transition-[box-shadow,transform,border-color,opacity] ${
              locked
                ? "border-border opacity-90"
                : "cursor-grab border-border hover:border-accent active:cursor-grabbing"
            } ${isDragging ? "scale-[1.02] border-accent opacity-60 shadow-[var(--shadow-card)]" : ""} ${
              isOver ? "border-accent shadow-[inset_0_2px_0_var(--accent)]" : ""
            }`}
          >
            <span aria-hidden className="text-muted">
              ⠿
            </span>
            <span>{label}</span>
          </li>
        );
      })}
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

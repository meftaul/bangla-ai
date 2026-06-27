"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_LABELS, STATUSES, type Status } from "@/lib/article-status";
import { FormPendingOverlay } from "@/components/loading-overlay";
import { setStatus } from "./actions";

// What each status means for learners — shown in the confirmation dialog so the
// admin knows the consequence before committing.
const STATUS_HINTS: Record<Status, string> = {
  draft: "It will be hidden from learners.",
  published: "Learners will be able to read it.",
  live_session: "It becomes available to start as a live session.",
};

// Segmented status control for one article. The current status is highlighted;
// clicking another segment opens a confirmation dialog, and confirming fires the
// `setStatus` server action. Only this row is a client component — the page stays
// server-rendered. The dialog escapes the sidebar's transformed stacking context
// because showModal() promotes it to the top layer.
export default function StatusControl({
  slug,
  title,
  current,
}: {
  slug: string;
  title: string;
  current: Status;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<Status | null>(null);

  // The action revalidates, so `current` changes once the write lands — close the
  // dialog when it does (no-op on first render / when already closed).
  useEffect(() => {
    dialogRef.current?.close();
  }, [current]);

  const ask = (next: Status) => {
    setPending(next);
    dialogRef.current?.showModal();
  };

  return (
    <>
      <div
        role="group"
        aria-label={`Status for ${title}`}
        className="inline-flex shrink-0 rounded-lg border border-border bg-background p-0.5"
      >
        {STATUSES.map((s) => {
          const active = s === current;
          return (
            <button
              key={s}
              type="button"
              onClick={() => !active && ask(s)}
              aria-pressed={active}
              title={active ? `Currently ${STATUS_LABELS[s]}` : `Set to ${STATUS_LABELS[s]}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        // Close on backdrop click (native <dialog> doesn't by default).
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-auto w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-foreground shadow-xl backdrop:bg-foreground/40 backdrop:backdrop-blur-sm"
      >
        {pending && (
          <form action={setStatus}>
            <FormPendingOverlay />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="status" value={pending} />
            <h2 className="font-display text-lg font-semibold">
              Set to {STATUS_LABELS[pending]}?
            </h2>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-foreground">{title}</span>{" "}
              — {STATUS_HINTS[pending]}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Confirm
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

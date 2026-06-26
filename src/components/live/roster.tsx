"use client";

import { useLiveSession } from "./session-context";

// Presenter header: the join code to read out + who's currently connected (presence).
export default function Roster({ joinCode }: { joinCode: string }) {
  const { roster } = useLiveSession();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">Join code</p>
        <p className="font-display text-3xl font-bold tracking-widest text-foreground">{joinCode}</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-muted">{roster.length} connected</p>
        <p className="max-w-xs truncate text-sm text-muted" title={roster.join(", ")}>
          {roster.join(", ") || "waiting for students…"}
        </p>
      </div>
    </div>
  );
}

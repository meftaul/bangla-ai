"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Deck from "@/components/deck";
import { createClient } from "@/lib/supabase/client";
import { endSession } from "@/app/dashboard/sessions/actions";

// Drives the live deck: broadcasts the presenter's slide to viewers and persists it
// (so late joiners catch up), then ends the session for everyone.
export default function PresenterDeck({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const channel = useMemo(
    () => supabase.channel(`session:${sessionId}:nav`),
    [supabase, sessionId],
  );
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => () => void supabase.removeChannel(channel), [supabase, channel]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReady = (instance: any) => {
    channel.subscribe();
    instance.on("slidechanged", (e: { indexh: number }) => {
      channel.send({ type: "broadcast", event: "nav", payload: { index: e.indexh } });
      // ponytail: trailing-throttle the DB write — only the latest index matters.
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        supabase.from("sessions").update({ current_slide: e.indexh }).eq("id", sessionId);
      }, 500);
    });
  };

  const end = async () => {
    setEnding(true);
    channel.send({ type: "broadcast", event: "control", payload: { type: "ended" } });
    await endSession(sessionId);
    router.push(`/dashboard/sessions/${sessionId}/report`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[60vh] overflow-hidden rounded-xl border border-border sm:h-[64vh] lg:h-[70vh]">
        <Deck onReady={onReady}>{children}</Deck>
      </div>
      <button
        type="button"
        onClick={end}
        disabled={ending}
        className="btn-secondary self-start disabled:opacity-60"
      >
        {ending ? "Ending…" : "End session"}
      </button>
    </div>
  );
}

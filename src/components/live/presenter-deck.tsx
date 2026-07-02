"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = useRef(false); // channel joined — gate broadcasts onto the WS, not REST
  const [ending, setEnding] = useState(false);

  // Fresh channel per effect run (React 19 StrictMode double-invokes effects in dev; a
  // memoized channel re-subscribed after removeChannel never rejoins, so its broadcasts
  // would fall back to REST). Mirrors viewer-deck / stage.
  useEffect(() => {
    const channel = supabase.channel(`session:${sessionId}:nav`, { config: { private: true } });
    channelRef.current = channel;
    channel.subscribe((status) => (ready.current = status === "SUBSCRIBED"));
    return () => {
      ready.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReady = (instance: any) => {
    const sendNav = () => {
      const { h, f } = instance.getIndices();
      if (ready.current)
        channelRef.current?.send({ type: "broadcast", event: "nav", payload: { index: h, f: f ?? -1 } });
      // ponytail: trailing-throttle the DB write — only the latest index matters.
      // ponytail: only the slide index persists (current_slide is an int) — late
      // joiners see fragments reset until the presenter's next step; add a column
      // if that ever matters.
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        // .then fires the request — the PostgREST builder is lazy, a bare call never runs.
        supabase.from("sessions").update({ current_slide: h }).eq("id", sessionId).then(() => {});
      }, 500);
    };
    instance.on("slidechanged", sendNav);
    instance.on("fragmentshown", sendNav);
    instance.on("fragmenthidden", sendNav);
  };

  const end = async () => {
    setEnding(true);
    // If somehow not joined, the persisted status='ended' still redirects viewers on load.
    if (ready.current)
      channelRef.current?.send({ type: "broadcast", event: "control", payload: { type: "ended" } });
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

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Deck from "@/components/deck";
import { createClient } from "@/lib/supabase/client";

// Student's deck: follows the presenter's slide, navigation locked. Jumps to the
// last-known slide on load, then live-follows; redirects to results when the
// presenter ends the session.
export default function ViewerDeck({
  sessionId,
  initialSlide,
  children,
}: {
  sessionId: string;
  initialSlide: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instanceRef = useRef<any>(null);
  const pendingIndex = useRef<number>(initialSlide);

  useEffect(() => {
    const channel = supabase.channel(`session:${sessionId}:nav`);
    channel.on("broadcast", { event: "nav" }, ({ payload }) => {
      const i = payload.index as number;
      pendingIndex.current = i;
      instanceRef.current?.slide(i);
    });
    channel.on("broadcast", { event: "control" }, ({ payload }) => {
      if (payload.type === "ended")
        router.push(`/dashboard/sessions/${sessionId}/results`);
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
      // ponytail: best-effort leave log — fires on in-app navigation/unmount; a hard
      // browser close may not flush it, leaving left_at null (joined_at is still solid).
      supabase
        .from("session_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .is("left_at", null);
    };
  }, [supabase, sessionId, router]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReady = (instance: any) => {
    instanceRef.current = instance;
    instance.slide(pendingIndex.current); // catch up to wherever the presenter is
  };

  return (
    <div className="h-[70vh] overflow-hidden rounded-lg border border-border">
      <Deck onReady={onReady} viewer>
        {children}
      </Deck>
    </div>
  );
}

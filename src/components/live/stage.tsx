"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import PresenterDeck from "@/components/live/presenter-deck";
import ViewerDeck from "@/components/live/viewer-deck";
import Whiteboard from "@/components/live/whiteboard";

type View = "deck" | "board";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Elements = readonly any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;
type Snapshot = { elements: Elements; scrollX: number; scrollY: number; zoom: number };

// Wraps the live deck + whiteboard and toggles between them. The presenter flips the
// view (broadcast + persisted); viewers follow. Both panels stay mounted and are
// shown/hidden with CSS — reveal.js inits once and Excalidraw is costly to recreate,
// so neither remounts. Owns the `:board` channel (the deck keeps its own `:nav`).
export default function Stage({
  mode,
  sessionId,
  initialView,
  initialScene,
  initialSlide = 0,
  children,
}: {
  mode: "presenter" | "viewer";
  sessionId: string;
  initialView: View;
  initialScene: Snapshot | Elements | null;
  initialSlide?: number;
  children: React.ReactNode; // the MDX <Article/> for the deck
}) {
  const supabase = useMemo(() => createClient(), []);
  const [view, setView] = useState<View>(initialView);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const ready = useRef(false); // channel joined — gate broadcasts onto the WS, not REST
  const apiRef = useRef<Api>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(0);

  // Fresh channel per effect run: React 19 StrictMode double-invokes effects in dev, and
  // a memoized instance can't be re-subscribed after removeChannel. Mirrors viewer-deck.
  // Listeners are registered before subscribe(), so the viewer never misses a draw.
  useEffect(() => {
    const channel = supabase.channel(`session:${sessionId}:board`);
    channelRef.current = channel;
    if (mode === "viewer") {
      channel.on("broadcast", { event: "view" }, ({ payload }) =>
        setView((payload as { view: View }).view),
      );
      channel.on("broadcast", { event: "draw" }, ({ payload }) => {
        const p = payload as Snapshot;
        apiRef.current?.updateScene({
          elements: p.elements,
          // Match the presenter's frame, not just the elements (canvas-space; assumes
          // similar canvas sizes — both boards share the same wrapper height).
          appState: { scrollX: p.scrollX, scrollY: p.scrollY, zoom: { value: p.zoom } },
        });
      });
    }
    channel.subscribe((status) => (ready.current = status === "SUBSCRIBED"));
    return () => {
      ready.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionId, mode]);

  const toggle = () => {
    const next: View = view === "deck" ? "board" : "deck";
    setView(next);
    if (ready.current)
      channelRef.current?.send({ type: "broadcast", event: "view", payload: { view: next } });
    // .then fires the request — the PostgREST builder is lazy, a bare call never runs.
    supabase.from("sessions").update({ board_view: next }).eq("id", sessionId).then(() => {});
  };

  // Presenter: throttle scene broadcasts (~150ms, so strokes flow mid-draw) and debounce
  // the DB snapshot (~1s — only late joiners read it). ponytail: broadcast the whole
  // scene each time (idempotent on the viewer); image blobs (files) aren't sent, so
  // pasted images won't sync. Switch to deltas only if a huge board hits the size cap.
  const onDraw = (elements: Elements, appState: AppState) => {
    const snap: Snapshot = {
      elements,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom.value,
    };
    const send = () => {
      lastSent.current = Date.now();
      if (ready.current)
        channelRef.current?.send({ type: "broadcast", event: "draw", payload: snap });
    };
    const since = Date.now() - lastSent.current;
    if (sendTimer.current) clearTimeout(sendTimer.current);
    if (since >= 150) send();
    else sendTimer.current = setTimeout(send, 150 - since);

    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      supabase.from("sessions").update({ board: snap }).eq("id", sessionId).then(() => {});
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-3">
      {mode === "presenter" && (
        <button type="button" onClick={toggle} className="btn-secondary self-start">
          {view === "deck" ? "Switch to whiteboard" : "Switch to slides"}
        </button>
      )}
      <div className={view === "board" ? "hidden" : undefined}>
        {mode === "presenter" ? (
          <PresenterDeck sessionId={sessionId}>{children}</PresenterDeck>
        ) : (
          <ViewerDeck sessionId={sessionId} initialSlide={initialSlide}>
            {children}
          </ViewerDeck>
        )}
      </div>
      <div className={view === "deck" ? "hidden" : undefined}>
        <Whiteboard
          readOnly={mode === "viewer"}
          initialScene={initialScene}
          active={view === "board"}
          onApi={(api) => (apiRef.current = api)}
          onChange={mode === "presenter" ? onDraw : undefined}
        />
      </div>
    </div>
  );
}

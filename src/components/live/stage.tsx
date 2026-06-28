"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
// The presenter's scene + its visible region (scroll/zoom in canvas-pixel space, plus the
// canvas size). Viewers fit that region to their own canvas, so it works cross-device.
type Snapshot = {
  elements: Elements;
  scrollX: number;
  scrollY: number;
  zoom: number;
  width: number;
  height: number;
};

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
  // Latest presenter view (seeded from the persisted snapshot for late joiners).
  const lastView = useRef<Snapshot | null>(
    initialScene && !Array.isArray(initialScene) ? (initialScene as Snapshot) : null,
  );
  const boardRef = useRef<HTMLDivElement>(null); // the viewer's whiteboard container, to size the fit

  // Viewer: fit the presenter's visible region into THIS canvas, whatever its size — so a
  // mobile student sees the same region a desktop teacher does (letterboxed when aspect
  // ratios differ), not a clipped corner. No-op unless the board is the visible, measured
  // panel (Excalidraw reports 0×0 while display:none).
  const fit = useCallback(() => {
    if (mode !== "viewer") return;
    const api = apiRef.current;
    const t = lastView.current;
    if (!api || !t || !t.width || !t.height || !t.zoom) return;
    // Measure the container from the DOM (always current after a layout/resize), not
    // getAppState() — Excalidraw's internal width/height lag a window resize by a frame.
    const box = boardRef.current?.getBoundingClientRect();
    const sw = box?.width ?? 0;
    const sh = box?.height ?? 0;
    if (!sw || !sh) return;
    const rw = t.width / t.zoom; // presenter's visible region, in scene units
    const rh = t.height / t.zoom;
    if (rw <= 0 || rh <= 0) return;
    const rx = -t.scrollX;
    const ry = -t.scrollY;
    const zoom = Math.max(0.1, Math.min(30, Math.min(sw / rw, sh / rh)));
    api.updateScene({
      appState: {
        scrollX: -rx + (sw / zoom - rw) / 2,
        scrollY: -ry + (sh / zoom - rh) / 2,
        zoom: { value: zoom },
      },
    });
  }, [mode]);


  // Fresh channel per effect run: React 19 StrictMode double-invokes effects in dev, and
  // a memoized instance can't be re-subscribed after removeChannel. Mirrors viewer-deck.
  // Listeners are registered before subscribe(), so the viewer never misses a draw.
  useEffect(() => {
    const channel = supabase.channel(`session:${sessionId}:board`, { config: { private: true } });
    channelRef.current = channel;
    if (mode === "viewer") {
      channel.on("broadcast", { event: "view" }, ({ payload }) =>
        setView((payload as { view: View }).view),
      );
      channel.on("broadcast", { event: "draw" }, ({ payload }) => {
        const p = payload as Snapshot;
        lastView.current = p;
        apiRef.current?.updateScene({ elements: p.elements });
        fit(); // re-fit the presenter's region to this canvas
      });
    }
    channel.subscribe((status) => (ready.current = status === "SUBSCRIBED"));
    return () => {
      ready.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [supabase, sessionId, mode, fit]);

  // Re-fit when the board becomes the visible panel, and on viewer window/orientation
  // change (refresh() makes Excalidraw redraw at the new size; fit reads the fresh DOM box).
  useEffect(() => {
    if (mode !== "viewer") return;
    if (view === "board") requestAnimationFrame(fit);
    const onResize = () => {
      apiRef.current?.refresh();
      requestAnimationFrame(fit);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode, view, fit]);

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
    // Skip while the board is hidden/unmeasured (e.g. toggled to slides): a 0×0 canvas
    // would clobber the saved snapshot and break viewers' region-fit.
    if (!appState.width || !appState.height) return;
    const snap: Snapshot = {
      elements,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom.value,
      width: appState.width, // canvas size travels so viewers can fit the region
      height: appState.height,
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
          onApi={(api) => {
            apiRef.current = api;
            if (mode === "viewer") requestAnimationFrame(fit); // initial fit for late joiners
          }}
          onChange={mode === "presenter" ? onDraw : undefined}
          containerRef={boardRef}
        />
      </div>
    </div>
  );
}

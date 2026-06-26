"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

// Excalidraw touches window/canvas on import — client-only (ssr:false must live in a
// "use client" module per Next's lazy-loading guide).
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((m) => m.Excalidraw),
  { ssr: false },
);

// Excalidraw's element / API types are heavy to import for the little we touch.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Elements = readonly any[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppState = any;
// Persisted snapshot: elements + the presenter's viewport. Older rows stored a bare
// elements array, so readers accept both.
type Snapshot = { elements: Elements; scrollX: number; scrollY: number; zoom: number };

// Presentational Excalidraw surface. The parent (Stage) owns the realtime channel: it
// pushes the presenter's scene in through the api (onApi) and receives the presenter's
// local edits via onChange. readOnly renders a student's follow-along board.
export default function Whiteboard({
  readOnly,
  initialScene,
  active,
  onApi,
  onChange,
}: {
  readOnly: boolean;
  initialScene: Snapshot | Elements | null;
  active: boolean; // is the board the visible panel right now
  onApi: (api: Api) => void;
  onChange?: (elements: Elements, appState: AppState) => void;
}) {
  const apiRef = useRef<Api>(null);

  // Excalidraw measures 0×0 while its container is display:none; recompute on reveal.
  useEffect(() => {
    if (active) apiRef.current?.refresh();
  }, [active]);

  // A snapshot carries the presenter's viewport; a bare array (legacy) or null doesn't.
  const snap =
    initialScene && !Array.isArray(initialScene) ? (initialScene as Snapshot) : null;
  const elements = Array.isArray(initialScene) ? initialScene : snap?.elements ?? [];
  // Viewer with a saved viewport opens on the presenter's frame; otherwise center content.
  // Loosely typed: Excalidraw brands zoom.value (NormalizedZoomValue), which a plain number
  // can't satisfy — and we feed it a runtime number anyway.
  const initialData: AppState =
    readOnly && snap
      ? { elements, appState: { scrollX: snap.scrollX, scrollY: snap.scrollY, zoom: { value: snap.zoom } } }
      : { elements, scrollToContent: true };

  return (
    <div className="h-[60vh] overflow-hidden rounded-xl border border-border sm:h-[64vh] lg:h-[70vh]">
      <Excalidraw
        viewModeEnabled={readOnly}
        initialData={initialData}
        excalidrawAPI={(api: Api) => {
          apiRef.current = api;
          onApi(api);
        }}
        onChange={onChange ? (els: Elements, state: AppState) => onChange(els, state) : undefined}
      />
    </div>
  );
}

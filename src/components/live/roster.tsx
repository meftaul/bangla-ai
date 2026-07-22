"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useLiveSession } from "./session-context";

// Presenter header: the join code to read out + who's currently connected (presence).
export default function Roster({ joinCode }: { joinCode: string }) {
  const { roster } = useLiveSession();
  const [qr, setQr] = useState("");
  const [url, setUrl] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // origin only exists client-side; idempotent, so StrictMode double-run is harmless
    const joinUrl = `${location.origin}/join/${joinCode}`;
    QRCode.toDataURL(joinUrl, { margin: 1, width: 640 }).then((data) => {
      setQr(data);
      setUrl(joinUrl);
    });
  }, [joinCode]);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4">
      <div className="flex items-center gap-4">
        {qr && (
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            title="Click to enlarge"
            className="cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
            <img
              src={qr}
              alt={`Scan to join with code ${joinCode}`}
              className="h-20 w-20 rounded-md border border-border"
            />
          </button>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Join code</p>
          <p className="font-display text-3xl font-bold tracking-widest text-foreground">{joinCode}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-muted">{roster.length} connected</p>
        <p className="max-w-xs truncate text-sm text-muted" title={roster.join(", ")}>
          {roster.join(", ") || "waiting for students…"}
        </p>
      </div>

      {/* Fullscreen-ish QR so students can scan from across the room. Native
          <dialog>: Esc closes for free; backdrop click closes via the onClick
          check below (the dialog element itself is only hit outside the card). */}
      <dialog
        ref={dialogRef}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto rounded-2xl border border-border bg-surface p-0 shadow-card backdrop:bg-black/60"
      >
        <div className="flex flex-col items-center gap-4 p-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
          <img
            src={qr}
            alt={`Scan to join with code ${joinCode}`}
            className="h-[min(70vmin,32rem)] w-[min(70vmin,32rem)] rounded-lg"
          />
          <p className="font-display text-4xl font-bold tracking-widest text-foreground">
            {joinCode}
          </p>
          <p className="text-lg text-muted">{url}</p>
        </div>
      </dialog>
    </div>
  );
}

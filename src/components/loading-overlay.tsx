"use client";

import { useEffect, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { Spinner } from "@phosphor-icons/react/dist/ssr";

export function LoadingOverlay({ show }: { show: boolean }) {
  // Portal to <body> so the fixed overlay escapes any transformed ancestor
  // (e.g. the dashboard sidebar, which has a transform and would otherwise
  // become the containing block, trapping the overlay inside it). Gate on a
  // mount flag so we only reach for `document` on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!show || !mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm"
    >
      <Spinner size={40} weight="bold" className="animate-spin text-accent" />
    </div>,
    document.body,
  );
}

// Drives the overlay from the parent <form>'s server-action pending state.
export function FormPendingOverlay() {
  const { pending } = useFormStatus();
  return <LoadingOverlay show={pending} />;
}

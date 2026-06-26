"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@phosphor-icons/react/dist/ssr";

export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm"
    >
      <Spinner size={40} weight="bold" className="animate-spin text-accent" />
    </div>
  );
}

// Drives the overlay from the parent <form>'s server-action pending state.
export function FormPendingOverlay() {
  const { pending } = useFormStatus();
  return <LoadingOverlay show={pending} />;
}

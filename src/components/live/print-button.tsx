"use client";

// Native print-to-PDF — no dependency. Hidden in the printed output itself.
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent print:hidden"
    >
      Download PDF
    </button>
  );
}

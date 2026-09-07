// The reader awaits a dynamic MDX import (katex etc.) — slowest route to paint.
// Show a title + prose skeleton immediately so the click registers.
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="h-9 w-2/3 rounded-lg bg-border/70" />
      <div className="mt-3 h-4 w-40 rounded bg-border/50" />
      <div className="mt-8 space-y-3">
        {["w-full", "w-full", "w-5/6", "w-full", "w-4/6"].map((w, i) => (
          <div key={i} className={`h-4 rounded bg-border/50 ${w}`} />
        ))}
      </div>
    </div>
  );
}

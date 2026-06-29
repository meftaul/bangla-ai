// Streamed instantly on navigation while the server resolves auth + queries.
// Static, no data — just a layout-shaped placeholder so clicks feel immediate.
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-border/70" />
      <div className="mt-2 h-4 w-72 rounded bg-border/50" />
      <div className="mt-8 h-40 rounded-2xl border border-border bg-surface" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}

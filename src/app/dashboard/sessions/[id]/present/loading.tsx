// Presenter pays a serial role -> session -> MDX-import chain before paint.
// Mirror the roster bar + stage so the screen isn't blank during it.
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-14 rounded-2xl border border-border bg-surface" />
      <div className="aspect-video rounded-2xl border border-border bg-surface" />
    </div>
  );
}

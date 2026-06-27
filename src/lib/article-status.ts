// Pure article-status constants — no Node/fs imports, so this is safe to import
// from client components (the StatusControl segmented control) as well as the
// server-side article helpers. `articles.ts` re-exports these for existing callers.

export type Status = "draft" | "published" | "live_session";
export const STATUSES: Status[] = ["draft", "published", "live_session"];

// Human-facing status labels — the snake_case `live_session` never reaches the UI.
export const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
  live_session: "Live",
};

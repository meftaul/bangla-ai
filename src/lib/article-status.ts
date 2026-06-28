// Pure article-status constants — no Node/fs imports, so this is safe to import
// from client components (the StatusControl segmented control) as well as the
// server-side article helpers. `articles.ts` re-exports these for existing callers.

export type Status = "draft" | "published";
export const STATUSES: Status[] = ["draft", "published"];

// Human-facing status labels.
export const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
};

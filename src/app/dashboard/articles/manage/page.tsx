import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole, listDiskArticles, mergeStatus, STATUSES, type Status } from "@/lib/articles";
import { setStatus } from "./actions";

export const metadata: Metadata = {
  title: "Manage articles — Bangla.AI",
};

export default async function ManageArticlesPage() {
  const supabase = await createClient();
  // UX gate; RLS is the real boundary on the write.
  if ((await getRole(supabase)) !== "admin") notFound();

  const [disk, { data: rows }] = await Promise.all([
    listDiskArticles(),
    supabase.from("articles").select("slug, status"),
  ]);
  const articles = mergeStatus(disk, (rows ?? []) as { slug: string; status: Status }[]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Manage articles
      </h1>
      <ul className="mt-8 flex flex-col gap-4">
        {articles.map((a) => (
          <li
            key={a.slug}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-foreground">
                {a.title}
              </p>
              <p className="truncate text-xs text-muted">{a.slug}</p>
            </div>
            <form action={setStatus} className="flex shrink-0 items-center gap-2">
              <input type="hidden" name="slug" value={a.slug} />
              <select
                name="status"
                defaultValue={a.status}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md border border-border bg-background px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-accent"
              >
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

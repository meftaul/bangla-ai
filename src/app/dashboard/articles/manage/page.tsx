import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole, listDiskArticles, mergeStatus, STATUSES, type Status } from "@/lib/articles";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";
import { setStatus } from "./actions";

export const metadata: Metadata = {
  title: "Manage articles — Bangla.AI",
};

export default async function ManageArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const supabase = await createClient();
  // UX gate; RLS is the real boundary on the write.
  if ((await getRole(supabase)) !== "admin") notFound();

  const [disk, { data: rows }] = await Promise.all([
    listDiskArticles(),
    supabase.from("articles").select("slug, status"),
  ]);
  const all = mergeStatus(disk, (rows ?? []) as { slug: string; status: Status }[]);
  const totalPages = Math.ceil(all.length / PAGE_SIZE) || 1;
  const articles = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Manage articles
      </h1>
      <ul className="mt-8 flex flex-col gap-4">
        {articles.map((a) => (
          <li
            key={a.slug}
            className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary px-3 py-1.5">
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
      <Pager page={page} totalPages={totalPages} params={sp} />
    </div>
  );
}

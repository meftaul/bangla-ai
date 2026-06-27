import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRole,
  listDiskArticles,
  mergeStatus,
  STATUS_LABELS,
  STATUSES,
  type Status,
} from "@/lib/articles";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";
import StatusControl from "./status-control";

export const metadata: Metadata = {
  title: "Manage articles — Bangla.AI",
};

// Tab filter values: every status plus the "all" pseudo-filter.
type Filter = Status | "all";
function filterOf(v: string | undefined): Filter {
  return v && (STATUSES as string[]).includes(v) ? (v as Status) : "all";
}

export default async function ManageArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const filter = filterOf(sp.status);
  const supabase = await createClient();
  // UX gate; RLS is the real boundary on the write.
  if ((await getRole(supabase)) !== "admin") notFound();

  const [disk, { data: rows }] = await Promise.all([
    listDiskArticles(),
    supabase.from("articles").select("slug, status"),
  ]);
  const all = mergeStatus(disk, (rows ?? []) as { slug: string; status: Status }[]);

  const counts: Record<Filter, number> = {
    all: all.length,
    draft: all.filter((a) => a.status === "draft").length,
    published: all.filter((a) => a.status === "published").length,
    live_session: all.filter((a) => a.status === "live_session").length,
  };

  const filtered = filter === "all" ? all : all.filter((a) => a.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const articles = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs: Filter[] = ["all", ...STATUSES];

  return (
    <div className="mx-auto max-w-3xl">
      <header className="fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Manage articles
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Publish, draft, or stage lessons for live sessions.
        </p>
      </header>

      <nav className="fade-up mt-6 flex flex-wrap gap-1" aria-label="Filter by status">
        {tabs.map((t) => {
          const active = t === filter;
          const label = t === "all" ? "All" : STATUS_LABELS[t];
          return (
            <Link
              key={t}
              href={`?status=${t}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent/10 text-accent-text"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs tabular-nums opacity-70">{counts[t]}</span>
            </Link>
          );
        })}
      </nav>

      {articles.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          {filter === "all"
            ? "No articles yet."
            : `No ${STATUS_LABELS[filter].toLowerCase()} articles yet.`}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
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
              <StatusControl slug={a.slug} title={a.title} current={a.status} />
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} totalPages={totalPages} params={sp} />
    </div>
  );
}

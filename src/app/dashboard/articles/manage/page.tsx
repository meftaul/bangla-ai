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
  type Article,
  type Status,
} from "@/lib/articles";
import { COURSES } from "@/content/courses";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";
import StatusControl from "./status-control";

export const metadata: Metadata = {
  title: "Manage library — Bangla.AI",
};

// Tab filter values: every status plus the "all" pseudo-filter.
type Filter = Status | "all";
function filterOf(v: string | undefined): Filter {
  return v && (STATUSES as string[]).includes(v) ? (v as Status) : "all";
}

export default async function ManageArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ap?: string; slp?: string }>;
}) {
  const sp = await searchParams;
  const filter = filterOf(sp.status);
  const supabase = await createClient();
  // UX gate; RLS is the real boundary on the write.
  if ((await getRole(supabase)) !== "admin") notFound();

  const [disk, { data: rows }, { data: courseRows }] = await Promise.all([
    listDiskArticles(),
    supabase.from("articles").select("slug, status"),
    supabase.from("courses").select("slug, status"),
  ]);
  const all = mergeStatus(disk, (rows ?? []) as { slug: string; status: Status }[]);

  // Courses: join the disk list with their DB status (missing row → draft).
  const courseStatus = new Map(
    ((courseRows ?? []) as { slug: string; status: Status }[]).map((r) => [r.slug, r.status]),
  );
  const courses = COURSES.map((c) => ({
    ...c,
    status: courseStatus.get(c.slug) ?? ("draft" as Status),
  }));

  const counts: Record<Filter, number> = {
    all: all.length,
    draft: all.filter((a) => a.status === "draft").length,
    published: all.filter((a) => a.status === "published").length,
  };

  // Status tabs scope both content sections; articles and slides are split so
  // decks (session material) manage separately from self-paced articles.
  const filtered = filter === "all" ? all : all.filter((a) => a.status === filter);
  const articles = filtered.filter((a) => a.type === "article");
  const slides = filtered.filter((a) => a.type === "slides");

  const tabs: Filter[] = ["all", ...STATUSES];

  return (
    <div className="mx-auto max-w-3xl">
      <header className="fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Manage library
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Publish or draft articles, slide decks, and courses.
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

      <ItemSection
        title="Articles"
        items={articles}
        param="ap"
        pageStr={sp.ap}
        params={sp}
        emptyLabel={filter === "all" ? "articles" : `${STATUS_LABELS[filter].toLowerCase()} articles`}
      />

      <ItemSection
        title="Slides"
        items={slides}
        param="slp"
        pageStr={sp.slp}
        params={sp}
        emptyLabel={filter === "all" ? "slide decks" : `${STATUS_LABELS[filter].toLowerCase()} slide decks`}
      />

      {courses.length > 0 && (
        <section className="fade-up mt-12">
          <h2 className="font-display text-lg font-semibold text-foreground">Courses</h2>
          <p className="mt-1 text-sm text-muted">
            A course and an item must both be published for learners to reach the item.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {courses.map((c) => (
              <li
                key={c.slug}
                className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-foreground">
                    {c.title}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {c.slug} · {c.items.length} {c.items.length === 1 ? "lesson" : "lessons"}
                  </p>
                </div>
                <StatusControl slug={c.slug} title={c.title} current={c.status} kind="course" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// One titled, paginated content section (Articles or Slides). Its own page param
// so the two sections page independently under the shared status filter.
function ItemSection({
  title,
  items,
  param,
  pageStr,
  params,
  emptyLabel,
}: {
  title: string;
  items: Article[];
  param: string;
  pageStr: string | undefined;
  params: Record<string, string | undefined>;
  emptyLabel: string;
}) {
  const page = pageNum(pageStr);
  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const shown = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="fade-up mt-10">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No {emptyLabel} yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {shown.map((a) => (
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
      <Pager page={page} totalPages={totalPages} param={param} params={params} />
    </section>
  );
}

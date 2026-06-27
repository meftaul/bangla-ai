import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { listDiskArticles } from "@/lib/articles";
import { scoreOf, type ActivityDef, type ResponseRow } from "@/lib/session";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";

export const metadata: Metadata = { title: "My sessions — Bangla.AI" };

type SessionRow = { id: string; slug: string; status: "live" | "ended"; started_at: string };
type Activity = ActivityDef & { session_id: string };
type Resp = ResponseRow & { session_id: string };

const FILTERS = ["all", "live", "completed"] as const;
type Filter = (typeof FILTERS)[number];

export default async function MySessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const filter: Filter = FILTERS.includes(sp.filter as Filter) ? (sp.filter as Filter) : "all";
  const supabase = await createClient();

  // RLS scopes participant rows to the current user; dedupe reconnect rows.
  const { data: parts } = await supabase
    .from("session_participants")
    .select("session_id");
  const ids = [...new Set((parts ?? []).map((p) => p.session_id as string))];

  if (ids.length === 0) {
    return (
      <div className="max-w-3xl">
        <Header />
        <div className="surface-card mt-8 flex flex-col items-start gap-3 p-8">
          <p className="text-sm text-muted">You haven&apos;t joined any sessions yet.</p>
          <Link href="/dashboard/live" className="btn-primary">
            Join a live session
          </Link>
        </div>
      </div>
    );
  }

  // sessions readable via the 0003 "participated" policy; per-user tables via RLS.
  const [{ data: sessions }, { data: acts }, { data: resp }, disk] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, slug, status, started_at")
      .in("id", ids)
      .order("started_at", { ascending: false }),
    supabase
      .from("session_activities")
      .select("session_id, activity_id, type, correct")
      .in("session_id", ids),
    supabase
      .from("responses")
      .select("session_id, activity_id, is_correct")
      .in("session_id", ids),
    listDiskArticles(),
  ]);

  const rows = (sessions ?? []) as SessionRow[];
  const activities = (acts ?? []) as Activity[];
  const responses = (resp ?? []) as Resp[];
  const titleBySlug = new Map(disk.map((a) => [a.slug, a.title]));

  // Score each session from its own activities + my responses.
  // ponytail: still fetches all responses to score; fine per-user, narrow to the
  // page's session ids only if a student's history gets large.
  const scored = rows.map((s) => ({
    ...s,
    title: titleBySlug.get(s.slug) ?? s.slug,
    score: scoreOf(
      activities.filter((a) => a.session_id === s.id),
      responses.filter((r) => r.session_id === s.id),
    ),
  }));

  // Summary stats over the full history (not just the visible page/filter).
  const liveCount = scored.filter((s) => s.status === "live").length;
  const endedCount = scored.length - liveCount;
  const scorable = scored.filter((s) => s.score.total > 0);
  const avg =
    scorable.length === 0
      ? null
      : Math.round(
          (scorable.reduce((sum, s) => sum + s.score.correct / s.score.total, 0) /
            scorable.length) *
            100,
        );
  const best = scorable.reduce<(typeof scorable)[number] | null>(
    (b, s) => (b && b.score.correct / b.score.total >= s.score.correct / s.score.total ? b : s),
    null,
  );

  const counts: Record<Filter, number> = {
    all: scored.length,
    live: liveCount,
    completed: endedCount,
  };

  const filtered =
    filter === "all"
      ? scored
      : scored.filter((s) => (filter === "live" ? s.status === "live" : s.status === "ended"));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-3xl">
      <Header
        stats={[
          { value: String(scored.length), label: "joined" },
          { value: avg === null ? "—" : `${avg}%`, label: "avg score" },
          {
            value: best ? `${best.score.correct}/${best.score.total}` : "—",
            label: "best",
          },
        ]}
      />

      {/* Filter tabs — links so the page stays a server component and the active
          filter is shareable / preserved across pagination. Each tab resets page. */}
      <nav
        className="fade-up mt-6 inline-flex flex-wrap items-center gap-1 rounded-full border border-border bg-surface p-1"
        style={{ animationDelay: "120ms" }}
        aria-label="Filter sessions"
      >
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Link
              key={f}
              href={f === "all" ? "?" : `?filter=${f}`}
              aria-current={active ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                active
                  ? "bg-accent/10 text-accent-text"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f}
              <span className={active ? "ml-1.5 text-accent-text/70" : "ml-1.5 text-muted/70"}>
                {counts[f]}
              </span>
            </Link>
          );
        })}
      </nav>

      {pageItems.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No {filter} sessions yet.{" "}
          <Link href="?" className="text-accent-text hover:underline">
            Show all
          </Link>
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {pageItems.map((s, i) => {
            const live = s.status === "live";
            const scoredHere = s.score.total > 0;
            return (
              <li key={s.id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  href={`/dashboard/sessions/${s.id}/results`}
                  className="surface-card group flex items-center gap-4 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-accent"
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 self-start rounded-full ${
                      live ? "bg-accent" : "border border-muted/50"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-base font-semibold text-foreground">
                        {s.title}
                      </span>
                      {live && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-text">
                          Live
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {new Date(s.started_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-display text-base font-semibold text-foreground">
                      {scoredHere ? `${s.score.correct} / ${s.score.total}` : "—"}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {scoredHere ? "score" : "no quiz"}
                    </span>
                  </span>
                  <ArrowRight
                    weight="bold"
                    size={16}
                    className="shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent-text"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pager page={page} totalPages={totalPages} params={{ filter: sp.filter }} />
    </div>
  );
}

function Header({ stats }: { stats?: { value: string; label: string }[] }) {
  return (
    <header>
      <p className="fade-up flex items-center gap-2 text-sm font-semibold text-muted">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span lang="bn" className="font-bangla">
          আমার ক্লাস
        </span>
      </p>
      <h1
        className="fade-up mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        style={{ animationDelay: "60ms" }}
      >
        My sessions
      </h1>
      {stats && (
        <dl
          className="fade-up mt-6 grid max-w-md grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-surface"
          style={{ animationDelay: "100ms" }}
        >
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-3">
              <dd className="font-display text-xl font-bold text-foreground">{s.value}</dd>
              <dt className="mt-0.5 text-xs text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

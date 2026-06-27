import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listDiskArticles } from "@/lib/articles";
import { scoreOf, type ActivityDef, type ResponseRow } from "@/lib/session";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";

export const metadata: Metadata = { title: "My sessions — Bangla.AI" };

type SessionRow = { id: string; slug: string; status: "live" | "ended"; started_at: string };
type Activity = ActivityDef & { session_id: string };
type Resp = ResponseRow & { session_id: string };

export default async function MySessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const supabase = await createClient();

  // RLS scopes participant rows to the current user; dedupe reconnect rows.
  const { data: parts } = await supabase
    .from("session_participants")
    .select("session_id");
  const ids = [...new Set((parts ?? []).map((p) => p.session_id as string))];

  if (ids.length === 0) {
    return (
      <div className="max-w-2xl">
        <Heading />
        <p className="mt-8 text-sm text-muted">You haven&apos;t joined any sessions yet.</p>
        <Link href="/dashboard/live" className="btn-primary mt-4">
          Join a live session
        </Link>
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
  const totalPages = Math.ceil(scored.length / PAGE_SIZE) || 1;
  const pageItems = scored.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-2xl">
      <Heading />
      <ul className="mt-8 flex flex-col gap-2">
        {pageItems.map((s) => (
          <li key={s.id}>
            <Link
              href={`/dashboard/sessions/${s.id}/results`}
              className="surface-card flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:border-accent"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {s.title}
                </span>
                <span className="text-xs text-muted">
                  {new Date(s.started_at).toLocaleDateString()}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs">
                {s.status === "live" && (
                  <span className="rounded bg-accent/15 px-2 py-0.5 text-accent-text">live</span>
                )}
                <span className="font-display text-sm font-semibold text-foreground">
                  {s.score.total === 0 ? "—" : `${s.score.correct} / ${s.score.total}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Pager page={page} totalPages={totalPages} params={sp} />
    </div>
  );
}

function Heading() {
  return (
    <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
      My sessions
    </h1>
  );
}

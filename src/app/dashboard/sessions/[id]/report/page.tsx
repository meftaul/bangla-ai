import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getRole, listDiskArticles } from "@/lib/articles";
import { scoreOf, type ActivityDef, type ResponseRow } from "@/lib/session";
import PrintButton from "@/components/live/print-button";

type Part = { user_id: string; email: string | null };
type Resp = ResponseRow & { user_id: string };

const pct = (s: { correct: number; total: number }) =>
  s.total === 0 ? -1 : s.correct / s.total;

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if ((await getRole(supabase)) !== "admin") notFound();

  const [{ data: session }, { data: parts }, { data: acts }, { data: resp }, disk] =
    await Promise.all([
      supabase.from("sessions").select("slug, status, started_at").eq("id", id).maybeSingle(),
      supabase.from("session_participants").select("user_id, email").eq("session_id", id),
      supabase.from("session_activities").select("activity_id, type, correct").eq("session_id", id),
      supabase.from("responses").select("activity_id, is_correct, user_id").eq("session_id", id),
      listDiskArticles(),
    ]);
  if (!session) notFound();

  const activities = (acts ?? []) as ActivityDef[];
  const responses = (resp ?? []) as Resp[];
  const title = disk.find((a) => a.slug === session.slug)?.title ?? session.slug;
  const live = session.status === "live";

  // Dedupe participants by user (multiple join rows = reconnects).
  const students = new Map<string, string | null>();
  for (const p of (parts ?? []) as Part[]) if (!students.has(p.user_id)) students.set(p.user_id, p.email);

  // Rank by score (unscored last), so the report reads as a leaderboard.
  const rows = Array.from(students.entries())
    .map(([user_id, email]) => ({
      email: email || user_id,
      score: scoreOf(activities, responses.filter((r) => r.user_id === user_id)),
    }))
    .sort((a, b) => pct(b.score) - pct(a.score) || a.email.localeCompare(b.email));

  const scorable = rows.filter((r) => r.score.total > 0);
  const avg =
    scorable.length === 0
      ? null
      : Math.round((scorable.reduce((s, r) => s + pct(r.score), 0) / scorable.length) * 100);
  const top = scorable.length === 0 ? null : Math.round(pct(scorable[0].score) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href="/dashboard/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent-text"
        >
          <ArrowLeft size={15} weight="bold" />
          Sessions
        </Link>
        <PrintButton />
      </div>

      <header className="mt-6">
        <p className="fade-up flex items-center gap-2 text-sm font-semibold text-muted">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span lang="bn" className="font-bangla">
            ক্লাস রিপোর্ট
          </span>
        </p>
        <h1
          className="fade-up mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          style={{ animationDelay: "60ms" }}
        >
          {title}
        </h1>
        <p
          className="fade-up mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted"
          style={{ animationDelay: "100ms" }}
        >
          <span>{new Date(session.started_at).toLocaleString()}</span>
          <span aria-hidden>·</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              live ? "bg-accent/15 text-accent-text" : "bg-background text-muted"
            }`}
          >
            {session.status}
          </span>
        </p>
      </header>

      <dl
        className="fade-up mt-8 grid max-w-md grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-surface"
        style={{ animationDelay: "140ms" }}
      >
        <Stat value={String(rows.length)} label="students" />
        <Stat value={avg === null ? "—" : `${avg}%`} label="avg score" />
        <Stat value={top === null ? "—" : `${top}%`} label="top score" />
      </dl>

      <div
        className="fade-up surface-card mt-6 overflow-hidden"
        style={{ animationDelay: "180ms" }}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-5 py-3 text-right font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const scored = r.score.total > 0;
              const p = scored ? Math.round(pct(r.score) * 100) : null;
              return (
                <tr key={r.email} className="border-b border-border last:border-0">
                  <td className="truncate px-5 py-3 text-foreground">{r.email}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span className="font-display font-semibold text-foreground">
                      {scored ? `${r.score.correct} / ${r.score.total}` : "—"}
                    </span>
                    {p !== null && (
                      <span className="ml-2 text-xs text-muted">{p}%</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-center text-muted" colSpan={2}>
                  No students joined this session.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-3">
      <dd className="font-display text-xl font-bold text-foreground">{value}</dd>
      <dt className="mt-0.5 text-xs text-muted">{label}</dt>
    </div>
  );
}

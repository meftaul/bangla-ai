import Link from "next/link";
import {
  ArrowLeft,
  ChartBar,
  CheckCircle,
  Circle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { listDiskArticles } from "@/lib/articles";
import { scoreOf, type ActivityDef, type ResponseRow } from "@/lib/session";

type Act = ActivityDef & { type: "quiz" | "poll" | "dragdrop" };
type Resp = { activity_id: string; response: unknown; is_correct: boolean | null };

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // session_activities is readable by any signed-in user; responses are own-only (RLS);
  // the session row is readable by a participant (0003 policy) for topic + date context.
  const [{ data: acts }, { data: mine }, { data: session }, disk] = await Promise.all([
    supabase.from("session_activities").select("activity_id, type, correct").eq("session_id", id),
    supabase.from("responses").select("activity_id, response, is_correct").eq("session_id", id),
    supabase.from("sessions").select("slug, started_at").eq("id", id).maybeSingle(),
    listDiskArticles(),
  ]);
  const title = session
    ? (disk.find((a) => a.slug === session.slug)?.title ?? session.slug)
    : null;
  const activities = ((acts ?? []) as Act[]).sort((a, b) =>
    a.activity_id.localeCompare(b.activity_id),
  );
  const responses = (mine ?? []) as Resp[];
  const score = scoreOf(activities as ActivityDef[], responses as ResponseRow[]);
  const byId = new Map(responses.map((r) => [r.activity_id, r]));

  const graded = activities.filter((a) => a.type !== "poll");
  const wrong = graded.filter((a) => {
    const r = byId.get(a.activity_id);
    return r && !r.is_correct;
  }).length;
  const missed = graded.filter((a) => !byId.has(a.activity_id)).length;
  const pct = score.total === 0 ? null : Math.round((score.correct / score.total) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/my-sessions"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent-text"
      >
        <ArrowLeft size={15} weight="bold" />
        My sessions
      </Link>

      <header className="mt-6">
        <p className="fade-up flex items-center gap-2 text-sm font-semibold text-muted">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span lang="bn" className="font-bangla">
            আমার ফলাফল
          </span>
        </p>
        <h1
          className="fade-up mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          style={{ animationDelay: "60ms" }}
        >
          {title ?? "Your results"}
        </h1>
        {session && (
          <p className="fade-up mt-2 text-sm text-muted" style={{ animationDelay: "100ms" }}>
            {new Date(session.started_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </header>

      {/* Score summary — the reward moment. */}
      <div
        className="fade-up surface-card mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        style={{ animationDelay: "140ms" }}
      >
        <div className="flex items-baseline gap-3">
          <span className="font-display text-4xl font-bold tabular-nums text-foreground">
            {score.correct}
            <span className="text-2xl text-muted"> / {score.total}</span>
          </span>
          {pct !== null && (
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-sm font-semibold text-accent-text">
              {pct}%
            </span>
          )}
        </div>
        {score.total > 0 && (
          <dl className="flex items-center gap-5 text-sm">
            <Tally value={score.correct} label="correct" tone="accent" />
            <Tally value={wrong} label="wrong" tone="danger" />
            <Tally value={missed} label="missed" tone="muted" />
          </dl>
        )}
      </div>

      {activities.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No graded activities in this session yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {activities.map((a, i) => {
            const r = byId.get(a.activity_id);
            const mineText = answerText(a.type, r?.response);
            const correctText =
              a.type === "quiz"
                ? (a.correct as { label?: string })?.label
                : a.type === "dragdrop"
                  ? (a.correct as string[])?.join(" → ")
                  : null;
            const status =
              a.type === "poll"
                ? { Icon: ChartBar, tone: "text-muted", label: "Poll" }
                : r?.is_correct
                  ? { Icon: CheckCircle, tone: "text-accent-text", label: "Correct" }
                  : r
                    ? { Icon: XCircle, tone: "text-danger", label: "Wrong" }
                    : { Icon: Circle, tone: "text-muted", label: "Not answered" };
            return (
              <li
                key={a.activity_id}
                className="fade-up surface-card p-4"
                style={{ animationDelay: `${160 + i * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-display text-sm font-semibold text-foreground">
                    {a.activity_id}
                  </span>
                  <span className={`flex shrink-0 items-center gap-1.5 text-sm ${status.tone}`}>
                    <status.Icon size={16} weight="fill" />
                    {status.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Your answer: <span className="text-foreground">{mineText ?? "—"}</span>
                </p>
                {correctText && a.type !== "poll" && !r?.is_correct && (
                  <p className="mt-0.5 text-sm text-muted">
                    Correct: <span className="text-accent-text">{correctText}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Tally({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "accent" | "danger" | "muted";
}) {
  const dot =
    tone === "accent" ? "bg-accent" : tone === "danger" ? "bg-danger" : "border border-muted/50";
  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
      <dd className="font-semibold text-foreground tabular-nums">{value}</dd>
      <dt className="text-muted">{label}</dt>
    </div>
  );
}

function answerText(type: string, response: unknown): string | null {
  if (response == null) return null;
  if (type === "dragdrop") return ((response as { order?: string[] }).order ?? []).join(" → ");
  return (response as { label?: string }).label ?? null;
}

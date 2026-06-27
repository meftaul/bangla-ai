import Link from "next/link";
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

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/my-sessions" className="text-sm text-muted hover:text-accent-text">
        ← My sessions
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Your results
      </h1>
      {title && (
        <p className="mt-1 text-sm text-muted">
          {title}
          {session && ` · ${new Date(session.started_at).toLocaleDateString()}`}
        </p>
      )}
      <p className="mt-3 text-lg text-foreground">
        Score: <span className="font-semibold">{score.correct}</span> / {score.total}
      </p>

      {activities.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No graded activities in this session yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {activities.map((a) => {
            const r = byId.get(a.activity_id);
            const mineText = answerText(a.type, r?.response);
            const correctText =
              a.type === "quiz"
                ? (a.correct as { label?: string })?.label
                : a.type === "dragdrop"
                  ? (a.correct as string[])?.join(" → ")
                  : null;
            return (
              <li key={a.activity_id} className="surface-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-sm font-semibold text-foreground">
                    {a.activity_id}
                  </span>
                  {a.type === "poll" ? (
                    <span className="text-xs text-muted">poll</span>
                  ) : (
                    <span className={r?.is_correct ? "text-accent-text" : "text-danger"}>
                      {r ? (r.is_correct ? "✓ correct" : "✗ wrong") : "✗ not answered"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">Your answer: {mineText ?? "—"}</p>
                {correctText && a.type !== "poll" && !r?.is_correct && (
                  <p className="text-sm text-muted">Correct: {correctText}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function answerText(type: string, response: unknown): string | null {
  if (response == null) return null;
  if (type === "dragdrop") return ((response as { order?: string[] }).order ?? []).join(" → ");
  return (response as { label?: string }).label ?? null;
}

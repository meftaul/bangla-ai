import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/articles";
import { scoreOf, type ActivityDef, type ResponseRow } from "@/lib/session";
import PrintButton from "@/components/live/print-button";

type Part = { user_id: string; email: string | null };
type Resp = ResponseRow & { user_id: string };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if ((await getRole(supabase)) !== "admin") notFound();

  const [{ data: session }, { data: parts }, { data: acts }, { data: resp }] = await Promise.all([
    supabase.from("sessions").select("slug, status, started_at").eq("id", id).maybeSingle(),
    supabase.from("session_participants").select("user_id, email").eq("session_id", id),
    supabase.from("session_activities").select("activity_id, type, correct").eq("session_id", id),
    supabase.from("responses").select("activity_id, is_correct, user_id").eq("session_id", id),
  ]);
  if (!session) notFound();

  const activities = (acts ?? []) as ActivityDef[];
  const responses = (resp ?? []) as Resp[];
  // Dedupe participants by user (multiple join rows = reconnects).
  const students = new Map<string, string | null>();
  for (const p of (parts ?? []) as Part[]) if (!students.has(p.user_id)) students.set(p.user_id, p.email);

  const rows = Array.from(students.entries())
    .map(([user_id, email]) => ({
      email: email ?? user_id,
      score: scoreOf(activities, responses.filter((r) => r.user_id === user_id)),
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href="/dashboard/sessions" className="text-sm text-muted hover:text-accent-text">
          ← Sessions
        </Link>
        <PrintButton />
      </div>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Session report
      </h1>
      <p className="mt-1 text-sm text-muted">
        {session.slug} · {new Date(session.started_at).toLocaleString()} · {session.status}
      </p>

      <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="py-2 font-medium">Student</th>
            <th className="py-2 text-right font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email} className="border-b border-border">
              <td className="py-2 text-foreground">{r.email}</td>
              <td className="py-2 text-right text-foreground">
                {r.score.correct} / {r.score.total}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="py-3 text-muted" colSpan={2}>
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

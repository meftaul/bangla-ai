import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole, listDiskArticles } from "@/lib/articles";
import { startSession } from "./actions";

export const metadata: Metadata = { title: "Live sessions — Bangla.AI" };

type SessionRow = {
  id: string;
  slug: string;
  status: "live" | "ended";
  started_at: string;
};

export default async function SessionsPage() {
  const supabase = await createClient();
  if ((await getRole(supabase)) !== "admin") notFound();

  const [disk, { data: sessions }] = await Promise.all([
    listDiskArticles(),
    supabase
      .from("sessions")
      .select("id, slug, status, started_at")
      .order("started_at", { ascending: false }),
  ]);
  const rows = (sessions ?? []) as SessionRow[];

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Live sessions
      </h1>

      <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Start a session</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {disk.map((a) => (
          <li
            key={a.slug}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-foreground">{a.title}</p>
              <p className="truncate text-xs text-muted">{a.slug}</p>
            </div>
            <form action={startSession}>
              <input type="hidden" name="slug" value={a.slug} />
              <button
                type="submit"
                className="rounded-md border border-border bg-background px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-accent"
              >
                Start
              </button>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-lg font-semibold text-foreground">Past & live</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((s) => (
          <li key={s.id}>
            <Link
              href={`/dashboard/sessions/${s.id}/${s.status === "live" ? "present" : "report"}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent"
            >
              <span className="truncate text-sm text-foreground">{s.slug}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                {new Date(s.started_at).toLocaleString()}
                <span
                  className={`rounded px-2 py-0.5 ${
                    s.status === "live" ? "bg-accent/15 text-accent-text" : "bg-background"
                  }`}
                >
                  {s.status}
                </span>
              </span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted">No sessions yet.</li>}
      </ul>
    </div>
  );
}

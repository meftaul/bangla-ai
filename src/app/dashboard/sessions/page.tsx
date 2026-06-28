import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole, listLiveSlides } from "@/lib/articles";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";
import { startSession } from "./actions";

export const metadata: Metadata = { title: "Live sessions — Bangla.AI" };

type SessionRow = {
  id: string;
  slug: string;
  status: "live" | "ended";
  started_at: string;
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; past?: string }>;
}) {
  const sp = await searchParams;
  const startPage = pageNum(sp.start);
  const pastPage = pageNum(sp.past);
  const supabase = await createClient();
  if ((await getRole(supabase)) !== "admin") notFound();

  const pastFrom = (pastPage - 1) * PAGE_SIZE;
  const [startAll, { data: sessions, count }] = await Promise.all([
    listLiveSlides(supabase),
    supabase
      .from("sessions")
      .select("id, slug, status, started_at", { count: "exact" })
      .order("started_at", { ascending: false })
      .range(pastFrom, pastFrom + PAGE_SIZE - 1),
  ]);

  // Start list: only published slide decks can be run live.
  const startTotalPages = Math.ceil(startAll.length / PAGE_SIZE) || 1;
  const startItems = startAll.slice((startPage - 1) * PAGE_SIZE, startPage * PAGE_SIZE);

  const rows = (sessions ?? []) as SessionRow[];
  const pastTotalPages = Math.ceil((count ?? 0) / PAGE_SIZE) || 1;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Live sessions
      </h1>

      <h2 className="mt-8 font-display text-lg font-semibold text-foreground">Start a session</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {startItems.map((a) => (
          <li
            key={a.slug}
            className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-foreground">{a.title}</p>
              <p className="truncate text-xs text-muted">{a.slug}</p>
            </div>
            <form action={startSession}>
              <input type="hidden" name="slug" value={a.slug} />
              <button type="submit" className="btn-secondary w-full px-3 py-1.5 sm:w-auto">
                Start
              </button>
            </form>
          </li>
        ))}
        {startItems.length === 0 && (
          <li className="text-sm text-muted">No published slide decks yet.</li>
        )}
      </ul>
      <Pager page={startPage} totalPages={startTotalPages} param="start" params={sp} />

      <h2 className="mt-10 font-display text-lg font-semibold text-foreground">Past & live</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((s) => (
          <li key={s.id}>
            <Link
              href={`/dashboard/sessions/${s.id}/${s.status === "live" ? "present" : "report"}`}
              className="surface-card flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:border-accent"
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
      <Pager page={pastPage} totalPages={pastTotalPages} param="past" params={sp} />
    </div>
  );
}

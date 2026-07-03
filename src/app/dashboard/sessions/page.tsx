import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Broadcast, Play } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getRole, listDiskArticles, listLiveSlides, topicFor } from "@/lib/articles";
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
  const [startAll, { data: sessions, count }, disk] = await Promise.all([
    listLiveSlides(supabase),
    supabase
      .from("sessions")
      .select("id, slug, status, started_at", { count: "exact" })
      .order("started_at", { ascending: false })
      .range(pastFrom, pastFrom + PAGE_SIZE - 1),
    listDiskArticles(),
  ]);

  // Start list: only published slide decks can be run live.
  const startTotalPages = Math.ceil(startAll.length / PAGE_SIZE) || 1;
  const startItems = startAll.slice((startPage - 1) * PAGE_SIZE, startPage * PAGE_SIZE);

  // Past sessions store only the slug; map to the deck title like /my-sessions does.
  const titleBySlug = new Map(disk.map((a) => [a.slug, a.title]));
  const rows = (sessions ?? []) as SessionRow[];
  const pastTotalPages = Math.ceil((count ?? 0) / PAGE_SIZE) || 1;

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="fade-up flex items-center gap-2 text-sm font-semibold text-muted">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span lang="bn" className="font-bangla">
            লাইভ ক্লাস
          </span>
        </p>
        <h1
          className="fade-up mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          style={{ animationDelay: "60ms" }}
        >
          Live sessions
        </h1>
        <p
          className="fade-up mt-2 max-w-prose text-sm leading-relaxed text-muted"
          style={{ animationDelay: "100ms" }}
        >
          Run a published slide deck live, or revisit a past session&apos;s report.
        </p>
      </header>

      <section className="fade-up mt-10" style={{ animationDelay: "140ms" }}>
        <h2 className="font-display text-lg font-semibold text-foreground">Start a session</h2>
        {startItems.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent-text">
              <Broadcast size={24} weight="duotone" />
            </span>
            <p className="font-display text-base font-semibold text-foreground">
              No decks ready to run
            </p>
            <p className="max-w-xs text-sm text-muted">
              Publish a slide-deck lesson from the{" "}
              <Link href="/dashboard/articles/manage" className="text-accent-text hover:underline">
                content manager
              </Link>{" "}
              to start it live.
            </p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {startItems.map((a, i) => {
              const { color, Icon } = topicFor(a.slug);
              return (
                <li
                  key={a.slug}
                  className="fade-up surface-card flex items-center gap-4 p-4"
                  style={{ animationDelay: `${160 + i * 40}ms` }}
                >
                  <span
                    aria-hidden
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                      color,
                    }}
                  >
                    <Icon size={22} weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold text-foreground">
                      {a.title}
                    </p>
                    <p className="truncate text-xs text-muted">{a.slug}</p>
                  </div>
                  <form action={startSession} className="shrink-0">
                    <input type="hidden" name="slug" value={a.slug} />
                    <button
                      type="submit"
                      className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2"
                    >
                      <Play size={15} weight="fill" />
                      Start
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
        <Pager page={startPage} totalPages={startTotalPages} param="start" params={sp} />
      </section>

      <section className="fade-up mt-12" style={{ animationDelay: "180ms" }}>
        <h2 className="font-display text-lg font-semibold text-foreground">Past &amp; live</h2>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No sessions yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2.5">
            {rows.map((s, i) => {
              const live = s.status === "live";
              return (
                <li key={s.id} className="fade-up" style={{ animationDelay: `${200 + i * 40}ms` }}>
                  <Link
                    href={`/dashboard/sessions/${s.id}/${live ? "present" : "report"}`}
                    className="surface-card group flex items-center gap-4 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-accent"
                  >
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        live ? "bg-accent" : "border border-muted/50"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display text-base font-semibold text-foreground">
                          {titleBySlug.get(s.slug) ?? s.slug}
                        </span>
                        {live && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-text">
                            Live
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {new Date(s.started_at).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
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
        <Pager page={pastPage} totalPages={pastTotalPages} param="past" params={sp} />
      </section>
    </div>
  );
}

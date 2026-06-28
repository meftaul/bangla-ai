import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CaretRight,
  Play,
  Television,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import {
  getRole,
  listDiskArticles,
  listLiveSlides,
  listPublishedArticles,
  topicFor,
} from "@/lib/articles";
import { scoreOf, type ActivityDef, type ResponseRow } from "@/lib/session";
import { navLinks } from "./nav-links";
import { joinSession, startSession } from "./sessions/actions";

export const metadata: Metadata = {
  title: "Dashboard — Bangla.AI",
};

const HOME_PREVIEW = 3;

type SessionRow = { id: string; slug: string; status: "live" | "ended"; started_at: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [{ data }, role] = await Promise.all([
    supabase.auth.getClaims(),
    getRole(supabase),
  ]);
  const email = data?.claims.email as string | undefined;
  const name = email?.split("@")[0];
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="fade-up flex items-center gap-2 text-sm font-semibold text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span lang="bn" className="font-bangla">
            স্বাগতম
          </span>
        </p>
        <h1
          className="fade-up mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          style={{ animationDelay: "80ms" }}
        >
          Welcome back
          {name ? (
            <>
              ,{" "}
              <span className="marker-stroke relative inline-block text-accent-text">
                {name}
                <span
                  aria-hidden
                  className="marker-stroke-fill absolute inset-x-0 bottom-1 -z-10 h-3"
                />
              </span>
            </>
          ) : (
            ""
          )}
          .
        </h1>
        <p
          className="fade-up mt-3 max-w-prose text-base leading-relaxed text-muted"
          style={{ animationDelay: "140ms" }}
        >
          {isAdmin
            ? "Run a class, tend your library, and see how the room did."
            : "Pick up where you left off, or jump into something new."}
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-12">
        {isAdmin ? (
          <AdminHome supabase={supabase} />
        ) : (
          <LearnerHome supabase={supabase} joinError={error} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Learner ------------------------------- */

async function LearnerHome({
  supabase,
  joinError,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  joinError?: string;
}) {
  const [articles, recent] = await Promise.all([
    listPublishedArticles(supabase),
    recentLearnerSessions(supabase),
  ]);

  const joinMessage =
    joinError === "notfound"
      ? "No live session with that code."
      : joinError === "empty"
        ? "Enter a join code."
        : null;

  return (
    <>
      {/* Primary action: join a live class. */}
      <section
        className="fade-up hero-glow rounded-3xl border border-border p-6 sm:p-8"
        style={{ animationDelay: "180ms" }}
      >
        <div className="flex items-center gap-2 text-accent-text">
          <Television size={20} weight="duotone" />
          <h2 className="font-display text-xl font-semibold text-foreground">
            Join a live class
          </h2>
        </div>
        <p lang="bn" className="mt-2 font-bangla text-sm leading-relaxed text-muted">
          ইনস্ট্রাক্টরের দেওয়া কোডটা দাও, ক্লাসে ঢুকে পড়ো।
        </p>
        <form
          action={joinSession}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          <input type="hidden" name="from" value="/dashboard" />
          <input
            name="code"
            autoComplete="off"
            placeholder="e.g. K7M2QX"
            aria-label="Join code"
            className="field-input bg-surface text-center text-xl font-bold uppercase tracking-[0.3em] placeholder:font-normal placeholder:normal-case placeholder:tracking-normal sm:flex-1 sm:text-2xl"
          />
          <button type="submit" className="btn-primary shrink-0 px-6 py-3 text-base">
            Join
            <ArrowRight weight="bold" />
          </button>
        </form>
        {joinMessage && <p className="mt-3 text-sm text-danger">{joinMessage}</p>}
      </section>

      {/* Continue learning. */}
      <Section
        title="Continue learning"
        href="/dashboard/articles"
        seeAll="Browse all"
        delay={240}
        empty={articles.length === 0 ? "No articles published yet." : undefined}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, HOME_PREVIEW).map((a) => {
            const { color, Icon } = topicFor(a.slug);
            return (
              <Link
                key={a.slug}
                href={`/dashboard/articles/${a.slug}`}
                className="surface-card group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-accent"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                    color,
                  }}
                >
                  <Icon size={22} weight="duotone" />
                </span>
                <p className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-accent-text">
                  {a.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Recent sessions with scores. */}
      <Section
        title="Recent sessions"
        href="/dashboard/my-sessions"
        seeAll="See all"
        delay={300}
        empty={
          recent.length === 0
            ? "You haven't joined a session yet — enter a code above to get started."
            : undefined
        }
      >
        <ul className="flex flex-col gap-2">
          {recent.map((s) => (
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
                    <span className="rounded bg-accent/15 px-2 py-0.5 text-accent-text">
                      live
                    </span>
                  )}
                  <span className="font-display text-sm font-semibold text-foreground">
                    {s.total === 0 ? "—" : `${s.correct} / ${s.total}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

// Recent joined sessions, scored. Mirrors my-sessions/page.tsx but bounded to the
// home preview — only the newest few session ids are scored, not the whole history.
// ponytail: re-fetches participant ids here rather than sharing a loader with
// my-sessions; one extra query, keeps the page self-contained. Extract a loader if
// a third caller appears.
async function recentLearnerSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data: parts } = await supabase
    .from("session_participants")
    .select("session_id");
  const ids = [...new Set((parts ?? []).map((p) => p.session_id as string))];
  if (ids.length === 0) return [];

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, slug, status, started_at")
    .in("id", ids)
    .order("started_at", { ascending: false })
    .limit(HOME_PREVIEW);
  const rows = (sessions ?? []) as SessionRow[];
  if (rows.length === 0) return [];

  const recentIds = rows.map((s) => s.id);
  const [{ data: acts }, { data: resp }, disk] = await Promise.all([
    supabase
      .from("session_activities")
      .select("session_id, activity_id, type, correct")
      .in("session_id", recentIds),
    supabase
      .from("responses")
      .select("session_id, activity_id, is_correct")
      .in("session_id", recentIds),
    listDiskArticles(),
  ]);
  const activities = (acts ?? []) as (ActivityDef & { session_id: string })[];
  const responses = (resp ?? []) as (ResponseRow & { session_id: string })[];
  const titleBySlug = new Map(disk.map((a) => [a.slug, a.title]));

  return rows.map((s) => ({
    ...s,
    title: titleBySlug.get(s.slug) ?? s.slug,
    ...scoreOf(
      activities.filter((a) => a.session_id === s.id),
      responses.filter((r) => r.session_id === s.id),
    ),
  }));
}

/* -------------------------------- Admin -------------------------------- */

async function AdminHome({
  supabase,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const [disk, liveSlides, { data: sessions }] = await Promise.all([
    listDiskArticles(),
    listLiveSlides(supabase),
    supabase
      .from("sessions")
      .select("id, slug, status, started_at")
      .order("started_at", { ascending: false })
      .limit(HOME_PREVIEW),
  ]);

  const startable = liveSlides.slice(0, HOME_PREVIEW);
  const recent = (sessions ?? []) as SessionRow[];
  const titleBySlug = new Map(disk.map((a) => [a.slug, a.title]));
  const links = navLinks(true);

  return (
    <>
      {/* Primary action: start a session. */}
      <section
        className="fade-up hero-glow rounded-3xl border border-border p-6 sm:p-8"
        style={{ animationDelay: "180ms" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-accent-text">
            <Play size={20} weight="duotone" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Start a session
            </h2>
          </div>
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-text hover:underline"
          >
            Manage
            <CaretRight weight="bold" size={14} />
          </Link>
        </div>

        {startable.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-3">
            {startable.map((a) => (
              <li
                key={a.slug}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-foreground">
                    {a.title}
                  </p>
                  <p className="truncate text-xs text-muted">{a.slug}</p>
                </div>
                <form action={startSession}>
                  <input type="hidden" name="slug" value={a.slug} />
                  <button type="submit" className="btn-primary w-full sm:w-auto">
                    <Play weight="fill" size={16} />
                    Start
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No published slide decks yet. Publish one in{" "}
            <Link
              href="/dashboard/articles/manage"
              className="text-accent-text hover:underline"
            >
              Manage library
            </Link>
            .
          </p>
        )}
      </section>

      {/* Recent & live sessions. */}
      <Section
        title="Recent sessions"
        href="/dashboard/sessions"
        seeAll="See all"
        delay={240}
        empty={recent.length === 0 ? "No sessions run yet." : undefined}
      >
        <ul className="flex flex-col gap-2">
          {recent.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/sessions/${s.id}/${s.status === "live" ? "present" : "report"}`}
                className="surface-card flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:border-accent"
              >
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {titleBySlug.get(s.slug) ?? s.slug}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                  {new Date(s.started_at).toLocaleString()}
                  <span
                    className={`rounded px-2 py-0.5 ${
                      s.status === "live"
                        ? "bg-accent/15 text-accent-text"
                        : "bg-background"
                    }`}
                  >
                    {s.status}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Library quick links. */}
      <Section title="Your library" delay={300}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {links
            .filter((l) => l.href !== "/dashboard" && l.href !== "/dashboard/sessions")
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="surface-card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-accent"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent-text">
                  <l.icon size={22} weight="bold" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-semibold text-foreground">
                    {l.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{l.blurb}</span>
                </span>
                <ArrowRight
                  weight="bold"
                  size={18}
                  className="shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent-text"
                />
              </Link>
            ))}
        </div>
      </Section>
    </>
  );
}

/* ------------------------------- Shared -------------------------------- */

// A home section: heading row with an optional "see all" link, then content or an
// empty-state line. Keeps the rhythm uniform across learner and admin views.
function Section({
  title,
  href,
  seeAll,
  delay,
  empty,
  children,
}: {
  title: string;
  href?: string;
  seeAll?: string;
  delay: number;
  empty?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        {href && seeAll && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-text hover:underline"
          >
            {seeAll}
            <CaretRight weight="bold" size={14} />
          </Link>
        )}
      </div>
      <div className="mt-4">
        {empty ? <p className="text-sm text-muted">{empty}</p> : children}
      </div>
    </section>
  );
}

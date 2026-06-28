import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Stack } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import {
  getRole,
  listDiskArticles,
  topicFor,
  STATUS_LABELS,
  type Status,
} from "@/lib/articles";
import { COURSES } from "@/content/courses";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = COURSES.find((c) => c.slug === slug);
  if (!course) notFound();

  const supabase = await createClient();
  // RLS returns the course row only if it's published or the viewer is admin.
  const [{ data: row }, role, disk, { data: itemRows }] = await Promise.all([
    supabase.from("courses").select("slug").eq("slug", slug).maybeSingle(),
    getRole(supabase),
    listDiskArticles(),
    supabase.from("articles").select("slug, status").in("slug", course.items),
  ]);
  if (!row) notFound();
  const isAdmin = role === "admin";

  // RLS already hides draft item rows from learners, so statusBySlug only holds
  // published items for them; admins get every status (default draft if no row).
  const statusBySlug = new Map(
    (itemRows ?? []).map((r) => [r.slug as string, r.status as Status]),
  );
  const bySlug = new Map(disk.map((a) => [a.slug, a]));

  // Keep the author-defined order. Learners see only published articles (slides
  // are session-only); admins see everything, with a status badge.
  const members = course.items
    .map((s) => bySlug.get(s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map((a) => ({ ...a, status: statusBySlug.get(a.slug) ?? "draft" }))
    .filter((a) => isAdmin || (a.status === "published" && a.type === "article"));

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/articles"
        className="text-sm text-muted hover:text-accent-text"
      >
        ← Library
      </Link>
      <header className="fade-up mt-4 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent-text">
          <Stack size={22} weight="duotone" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {course.title}
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
            {course.description}
          </p>
        </div>
      </header>

      {members.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing published in this course yet.</p>
      ) : (
        <ol className="mt-8 flex flex-col gap-3">
          {members.map((a, i) => {
            const { color, Icon } = topicFor(a.slug);
            return (
              <li key={a.slug}>
                <Link
                  href={`/dashboard/articles/${a.slug}`}
                  className="surface-card group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-accent sm:p-5"
                >
                  <span className="font-display text-sm font-semibold tabular-nums text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                      color,
                    }}
                  >
                    <Icon size={20} weight="duotone" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-display text-base font-semibold text-foreground group-hover:text-accent-text">
                        {a.title}
                      </span>
                      <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted">
                        {a.type === "slides" ? "Slides" : "Article"}
                      </span>
                      {isAdmin && a.status !== "published" && (
                        <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent-text">
                          {STATUS_LABELS[a.status]}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {a.description}
                    </span>
                  </span>
                  <ArrowRight
                    weight="bold"
                    size={18}
                    className="shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent-text"
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

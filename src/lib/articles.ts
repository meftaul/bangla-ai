import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Atom, Brain, ChartLineUp, Code, Lightbulb } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { createClient } from "@/lib/supabase/server";
import { COURSES, type Course } from "@/content/courses";

// Status type/constants live in a client-safe module (no fs); re-export so existing
// server callers can keep importing them from "@/lib/articles".
export { STATUSES, STATUS_LABELS } from "./article-status";
export type { Status } from "./article-status";
import type { Status } from "./article-status";
export type { Course };

// "article" = freeform prose (self-paced only); "slides" = reveal.js deck, the
// only kind runnable as a live session. It's a disk fact (MDX metadata), never
// stored in the DB.
export type ItemType = "article" | "slides";
export type DiskArticle = {
  slug: string;
  title: string;
  description: string;
  type: ItemType;
};
export type Article = DiskArticle & { status: Status };

const ARTICLES_DIR = join(process.cwd(), "src/content/articles");

// Pulls title/description from the `export const metadata = {...}` block by reading
// the raw file — NOT by importing the MDX, which would compile every article (katex
// et al.) just to read a string. Filesystem is the source of truth for which exist.
function readMeta(field: string, block: string): string | undefined {
  // ponytail: regex over a flat object literal; switch to a real parser if metadata gains nesting.
  return block.match(new RegExp(`${field}:\\s*["']([^"']*)["']`))?.[1];
}

export async function listDiskArticles(): Promise<DiskArticle[]> {
  const files = await readdir(ARTICLES_DIR);
  const slugs = files.filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4));

  const articles = await Promise.all(
    slugs.map(async (slug) => {
      const text = await readFile(join(ARTICLES_DIR, `${slug}.mdx`), "utf8");
      const block = text.match(/export const metadata\s*=\s*\{[\s\S]*?\}/)?.[0] ?? "";
      return {
        slug,
        title: readMeta("title", block) ?? slug,
        description: readMeta("description", block) ?? "",
        // Default to the safe, non-runnable kind when omitted.
        type: readMeta("type", block) === "slides" ? "slides" : "article",
      } satisfies DiskArticle;
    }),
  );
  return articles.sort((a, b) => a.title.localeCompare(b.title));
}

// Course slugs that contain this item (disk-only fact). Empty = standalone.
export function coursesForSlug(slug: string): string[] {
  return COURSES.filter((c) => c.items.includes(slug)).map((c) => c.slug);
}

// Pure visibility rule for a *published* item: a learner may view it iff it's
// standalone (in no course) or in at least one published course. Status is
// filtered separately (by the DB query); this only adds the course gate.
export function isItemVisible(
  memberships: string[],
  publishedCourseSlugs: Set<string>,
): boolean {
  return (
    memberships.length === 0 ||
    memberships.some((s) => publishedCourseSlugs.has(s))
  );
}

// Self-paced articles visible to a learner, in disk (title) order: type article
// (slides are session-only — never browsable standalone) AND published AND
// (standalone or in a published course). Shared by the Library and the dashboard
// "continue learning" rail. Explicit filters so admins are scoped too.
export async function listPublishedArticles(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<DiskArticle[]> {
  const [{ data: rows }, publishedCourses] = await Promise.all([
    supabase.from("articles").select("slug").eq("status", "published"),
    listPublishedCourseSlugs(supabase),
  ]);
  const published = new Set((rows ?? []).map((r) => r.slug as string));
  return (await listDiskArticles()).filter(
    (a) =>
      a.type === "article" &&
      published.has(a.slug) &&
      isItemVisible(coursesForSlug(a.slug), publishedCourses),
  );
}

// Published slide decks — the only items startable as a live session. No course
// gate: an admin starts sessions regardless of course publication.
export async function listLiveSlides(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<DiskArticle[]> {
  const { data: rows } = await supabase
    .from("articles")
    .select("slug")
    .eq("status", "published");
  const published = new Set((rows ?? []).map((r) => r.slug as string));
  return (await listDiskArticles()).filter(
    (a) => a.type === "slides" && published.has(a.slug),
  );
}

async function listPublishedCourseSlugs(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("courses")
    .select("slug")
    .eq("status", "published");
  return new Set((data ?? []).map((r) => r.slug as string));
}

// Disk courses whose DB row is published, in declaration order.
export async function listPublishedCourses(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Course[]> {
  const published = await listPublishedCourseSlugs(supabase);
  return COURSES.filter((c) => published.has(c.slug));
}

// Categorical accent + icon per article (subject coding only — green stays the one
// CTA accent). Articles carry no category field, so derive a stable choice from the
// slug; add a `category` frontmatter field later to make this semantic.
export type Topic = { color: string; Icon: Icon };
const TOPICS: Topic[] = [
  { color: "var(--cat-blue)", Icon: Brain },
  { color: "var(--cat-amber)", Icon: Lightbulb },
  { color: "var(--cat-coral)", Icon: ChartLineUp },
  { color: "var(--cat-violet)", Icon: Atom },
  { color: "var(--cat-teal)", Icon: Code },
];

export function topicFor(slug: string): Topic {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return TOPICS[h % TOPICS.length];
}

// UI gating only (not a security boundary — RLS is). Reads own profile row.
export async function getRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<"admin" | "user"> {
  const { data } = await supabase.from("profiles").select("role").maybeSingle();
  return data?.role === "admin" ? "admin" : "user";
}

// Pure join: disk articles + DB status rows. Missing row defaults to draft.
export function mergeStatus(
  disk: DiskArticle[],
  rows: { slug: string; status: Status }[],
): Article[] {
  const bySlug = new Map(rows.map((r) => [r.slug, r.status]));
  return disk.map((a) => ({ ...a, status: bySlug.get(a.slug) ?? "draft" }));
}

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Atom, Brain, ChartLineUp, Code, Lightbulb } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { createClient } from "@/lib/supabase/server";

export type Status = "draft" | "published" | "live_session";
export const STATUSES: Status[] = ["draft", "published", "live_session"];

export type DiskArticle = { slug: string; title: string; description: string };
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
      };
    }),
  );
  return articles.sort((a, b) => a.title.localeCompare(b.title));
}

// Disk articles whose DB row is published, in disk (title) order. Shared by the
// articles list and the dashboard "continue learning" rail. Explicit published
// filter so admins are scoped too (RLS alone lets them read every row).
export async function listPublishedArticles(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<DiskArticle[]> {
  const { data: rows } = await supabase
    .from("articles")
    .select("slug")
    .eq("status", "published");
  const visible = new Set((rows ?? []).map((r) => r.slug as string));
  return (await listDiskArticles()).filter((a) => visible.has(a.slug));
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

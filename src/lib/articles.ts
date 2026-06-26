import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
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

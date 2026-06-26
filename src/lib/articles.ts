import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { createClient } from "@/lib/supabase/server";

export type Status = "draft" | "published" | "live_session";
export const STATUSES: Status[] = ["draft", "published", "live_session"];

export type DiskArticle = { slug: string; title: string; description: string };
export type Article = DiskArticle & { status: Status };

const ARTICLES_DIR = join(process.cwd(), "src/content/articles");

// Reads every MDX file and pulls its `metadata` export ({ title, description }).
// Filesystem is the source of truth for which articles exist.
export async function listDiskArticles(): Promise<DiskArticle[]> {
  const files = await readdir(ARTICLES_DIR);
  const slugs = files.filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4));

  const articles = await Promise.all(
    slugs.map(async (slug) => {
      const mod = await import(`@/content/articles/${slug}.mdx`);
      const meta = (mod.metadata ?? {}) as { title?: string; description?: string };
      return { slug, title: meta.title ?? slug, description: meta.description ?? "" };
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

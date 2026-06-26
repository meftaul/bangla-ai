import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listDiskArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles — Bangla.AI",
};

export default async function ArticlesPage() {
  const supabase = await createClient();
  // RLS returns only published rows for users (all for admins).
  const { data: rows } = await supabase.from("articles").select("slug");
  const visible = new Set((rows ?? []).map((r) => r.slug));
  const articles = (await listDiskArticles()).filter((a) => visible.has(a.slug));

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Articles
      </h1>
      <ul className="mt-8 flex flex-col gap-4">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/dashboard/articles/${a.slug}`}
              className="block rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent"
            >
              <p className="font-display text-lg font-semibold text-foreground">{a.title}</p>
              <p className="mt-1 text-sm text-muted">{a.description}</p>
            </Link>
          </li>
        ))}
        {articles.length === 0 && (
          <li className="text-sm text-muted">No articles published yet.</li>
        )}
      </ul>
    </div>
  );
}

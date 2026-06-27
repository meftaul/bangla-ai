import type { Metadata } from "next";
import Link from "next/link";
import { Atom, Brain, ChartLineUp, Code, Lightbulb } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { listDiskArticles } from "@/lib/articles";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Articles — Bangla.AI",
};

// Categorical accent set (subject coding only — green stays the one CTA accent).
// Articles carry no category field, so pick a stable color+icon from the slug;
// add a `category` frontmatter field later to make this semantic.
const TOPICS = [
  { color: "var(--cat-blue)", Icon: Brain },
  { color: "var(--cat-amber)", Icon: Lightbulb },
  { color: "var(--cat-coral)", Icon: ChartLineUp },
  { color: "var(--cat-violet)", Icon: Atom },
  { color: "var(--cat-teal)", Icon: Code },
];

function topicFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return TOPICS[h % TOPICS.length];
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const supabase = await createClient();
  // Explicit published filter so admins are scoped too (RLS alone lets them read all).
  const { data: rows } = await supabase
    .from("articles")
    .select("slug")
    .eq("status", "published");
  const visible = new Set((rows ?? []).map((r) => r.slug));
  const all = (await listDiskArticles()).filter((a) => visible.has(a.slug));
  const totalPages = Math.ceil(all.length / PAGE_SIZE) || 1;
  const articles = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Articles
      </h1>
      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {articles.map((a) => {
          const { color, Icon } = topicFor(a.slug);
          return (
            <li key={a.slug}>
              <Link
                href={`/dashboard/articles/${a.slug}`}
                className="surface-card group block h-full p-5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg sm:p-6"
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
                <p className="mt-4 font-display text-lg font-semibold text-foreground group-hover:text-accent-text">
                  {a.title}
                </p>
                <p className="mt-1 text-sm text-muted">{a.description}</p>
              </Link>
            </li>
          );
        })}
        {articles.length === 0 && (
          <li className="text-sm text-muted">No articles published yet.</li>
        )}
      </ul>
      <Pager page={page} totalPages={totalPages} params={sp} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { listPublishedArticles, topicFor } from "@/lib/articles";
import { Pager } from "@/components/pager";
import { PAGE_SIZE, pageNum } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Articles — Bangla.AI",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const supabase = await createClient();
  const all = await listPublishedArticles(supabase);
  const totalPages = Math.ceil(all.length / PAGE_SIZE) || 1;
  const articles = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="fade-up flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Articles
          </h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
            Courses, notebooks, and primers — read at your own pace.
          </p>
        </div>
        {all.length > 0 && (
          <p className="text-sm text-muted">
            {all.length} {all.length === 1 ? "article" : "articles"}
          </p>
        )}
      </header>

      {articles.length === 0 ? (
        <div className="fade-up mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent-text">
            <BookOpen size={24} weight="duotone" />
          </span>
          <p className="font-display text-base font-semibold text-foreground">
            Nothing here yet
          </p>
          <p lang="bn" className="font-bangla text-sm text-muted">
            নতুন নিবন্ধ শীঘ্রই আসছে — একটু পরে আবার দেখো।
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => {
            const { color, Icon } = topicFor(a.slug);
            return (
              <li
                key={a.slug}
                className="fade-up"
                style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
              >
                <Link
                  href={`/dashboard/articles/${a.slug}`}
                  className="surface-card group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-accent sm:p-6"
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
                  <p className="mt-1 line-clamp-3 text-sm text-muted">{a.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-accent-text opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:opacity-100">
                    Read
                    <ArrowRight
                      size={15}
                      weight="bold"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Pager page={page} totalPages={totalPages} params={sp} />
    </div>
  );
}

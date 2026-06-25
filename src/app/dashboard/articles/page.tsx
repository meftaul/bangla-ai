import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Articles — Bangla.AI",
};

// ponytail: hardcoded list. Swap for an fs glob over src/content/articles
// (+ gray-matter for titles) when there's more than one article.
const ARTICLES = [
  { slug: "intro", title: "Bangla.AI — intro", desc: "Slides, a live quiz, and math." },
];

export default function ArticlesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Articles
      </h1>
      <ul className="mt-8 flex flex-col gap-4">
        {ARTICLES.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/dashboard/articles/${a.slug}`}
              className="block rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent"
            >
              <p className="font-display text-lg font-semibold text-foreground">{a.title}</p>
              <p className="mt-1 text-sm text-muted">{a.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

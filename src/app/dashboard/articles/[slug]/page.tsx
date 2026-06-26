import "katex/dist/katex.min.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import Deck from "@/components/deck";
import { createClient } from "@/lib/supabase/server";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // RLS returns a row only if the article is published or the viewer is admin.
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!article) notFound();

  let Article: React.ComponentType;
  let metadata: { presentation?: boolean } = {};
  try {
    ({ default: Article, metadata = {} } = await import(`@/content/articles/${slug}.mdx`));
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/articles" className="text-sm text-muted hover:text-accent-text">
        ← Articles
      </Link>
      {metadata.presentation === false ? (
        <article className="article rounded-lg border border-border bg-surface p-8">
          <Article />
        </article>
      ) : (
        // embedded deck needs an explicit height to lay out
        <div className="h-[70vh] overflow-hidden rounded-lg border border-border">
          <Deck>
            <Article />
          </Deck>
        </div>
      )}
    </div>
  );
}

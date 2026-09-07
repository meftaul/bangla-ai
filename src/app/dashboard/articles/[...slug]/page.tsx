import "katex/dist/katex.min.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import Deck from "@/components/deck";
import { createClient } from "@/lib/supabase/server";
import { coursesForSlug, getRole } from "@/lib/articles";

export default async function ArticlePage({
  params,
}: {
  // Catch-all: articles may live in a subdirectory, so the slug can have
  // segments ("llm/01-what-is-llm"). Rejoin them into the on-disk slug.
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug.join("/");

  // RLS returns a row only if the item is published or the viewer is admin.
  const supabase = await createClient();
  const [{ data: article }, role] = await Promise.all([
    supabase.from("articles").select("slug").eq("slug", slug).maybeSingle(),
    getRole(supabase),
  ]);
  if (!article) notFound();

  // ponytail: course membership lives on disk, so RLS can't enforce the
  // "containing course must also be published" gate — do it app-level here.
  // Drafts stay RLS-protected above; this only hides a published item whose
  // course(s) are all still draft.
  if (role !== "admin") {
    const memberships = coursesForSlug(slug);
    if (memberships.length > 0) {
      const { data: published } = await supabase
        .from("courses")
        .select("slug")
        .eq("status", "published")
        .in("slug", memberships);
      if (!published || published.length === 0) notFound();
    }
  }

  let Article: React.ComponentType;
  let metadata: { type?: string } = {};
  try {
    ({ default: Article, metadata = {} } = await import(`@/content/articles/${slug}.mdx`));
  } catch {
    notFound();
  }

  // Slide decks are session-only — students reach them through a live session,
  // never as a self-paced page. Admins may still open one to preview.
  if (role !== "admin" && metadata.type === "slides") notFound();

  // Prose is a centered reading column (matching loading.tsx and every other
  // dashboard page); a deck stays full-bleed, since reveal scales to its frame.
  const isSlides = metadata.type === "slides";

  return (
    <div className={`flex flex-col gap-4${isSlides ? "" : " mx-auto w-full max-w-3xl"}`}>
      <Link href="/dashboard/articles" className="text-sm text-muted hover:text-accent-text">
        ← Library
      </Link>
      {!isSlides ? (
        <article className="article surface-card p-5 sm:p-8">
          <Article />
        </article>
      ) : (
        <div className="deck-frame">
          <Deck>
            <Article />
          </Deck>
        </div>
      )}
    </div>
  );
}

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

  // A journey (components/journey) is a one-screen app, not a scrolling page:
  // when the article holds one, the card takes exactly the viewport under the
  // 3.5rem header (less the main padding it keeps on sm+, 1.5rem / lg 2.5rem
  // each side). On phones it goes edge to edge and the shell hides its header
  // (dashboard-shell.tsx), so it gets the full 100dvh. The Journey's own ×
  // replaces the Library link. Detected with :has(), so no MDX needs a flag.
  return (
    <div
      className={`group/page flex flex-col gap-4${
        isSlides
          ? ""
          : " mx-auto w-full max-w-3xl max-sm:has-[[data-journey]]:-mx-4 max-sm:has-[[data-journey]]:-my-6 max-sm:has-[[data-journey]]:w-auto"
      }`}
    >
      <Link href="/dashboard/articles" className="text-sm text-muted group-has-[[data-journey]]/page:hidden hover:text-accent-text">
        ← Library
      </Link>
      {!isSlides ? (
        <article className="article surface-card p-5 sm:p-8 max-sm:has-[[data-journey]]:h-dvh has-[[data-journey]]:min-h-[26rem] has-[[data-journey]]:overflow-hidden has-[[data-journey]]:p-0 max-sm:has-[[data-journey]]:rounded-none max-sm:has-[[data-journey]]:border-0 max-sm:has-[[data-journey]]:shadow-none sm:has-[[data-journey]]:h-[calc(100dvh-6.5rem)] lg:has-[[data-journey]]:h-[calc(100dvh-8.5rem)]">
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

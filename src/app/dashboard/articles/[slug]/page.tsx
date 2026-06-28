import "katex/dist/katex.min.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import Deck from "@/components/deck";
import { createClient } from "@/lib/supabase/server";
import { coursesForSlug, getRole } from "@/lib/articles";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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

  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/articles" className="text-sm text-muted hover:text-accent-text">
        ← Library
      </Link>
      {metadata.type !== "slides" ? (
        <article className="article surface-card max-w-3xl p-5 sm:p-8">
          <Article />
        </article>
      ) : (
        // embedded deck needs an explicit height to lay out; shorter on phones
        <div className="h-[60vh] overflow-hidden rounded-xl border border-border sm:h-[64vh] lg:h-[70vh]">
          <Deck>
            <Article />
          </Deck>
        </div>
      )}
    </div>
  );
}

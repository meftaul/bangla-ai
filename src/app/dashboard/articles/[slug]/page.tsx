import Link from "next/link";
import { notFound } from "next/navigation";
import Deck from "@/components/deck";

export function generateStaticParams() {
  return [{ slug: "intro" }];
}

export const dynamicParams = false; // unknown slug → 404

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let Article: React.ComponentType;
  try {
    ({ default: Article } = await import(`@/content/articles/${slug}.mdx`));
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/articles" className="text-sm text-muted hover:text-accent-text">
        ← Articles
      </Link>
      {/* embedded deck needs an explicit height to lay out */}
      <div className="h-[70vh] overflow-hidden rounded-lg border border-border">
        <Deck>
          <Article />
        </Deck>
      </div>
    </div>
  );
}

import "katex/dist/katex.min.css";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveSessionProvider } from "@/components/live/session-context";
import ViewerDeck from "@/components/live/viewer-deck";

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS lets students read only live sessions; once ended it disappears -> results.
  const { data: session } = await supabase
    .from("sessions")
    .select("slug, status, current_slide")
    .eq("id", id)
    .maybeSingle();
  if (!session || session.status !== "live") redirect(`/dashboard/sessions/${id}/results`);

  let Article: React.ComponentType;
  try {
    ({ default: Article } = await import(`@/content/articles/${session.slug}.mdx`));
  } catch {
    notFound();
  }

  return (
    <LiveSessionProvider mode="viewer" sessionId={id}>
      <ViewerDeck sessionId={id} initialSlide={session.current_slide}>
        <Article />
      </ViewerDeck>
    </LiveSessionProvider>
  );
}

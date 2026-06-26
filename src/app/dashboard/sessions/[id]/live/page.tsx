import "katex/dist/katex.min.css";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveSessionProvider } from "@/components/live/session-context";
import Stage from "@/components/live/stage";

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS lets students read only live sessions; once ended it disappears -> results.
  const { data: session } = await supabase
    .from("sessions")
    .select("slug, status, current_slide, board, board_view")
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
      <Stage
        mode="viewer"
        sessionId={id}
        initialView={session.board_view}
        initialScene={session.board}
        initialSlide={session.current_slide}
      >
        <Article />
      </Stage>
    </LiveSessionProvider>
  );
}

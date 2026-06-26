import "katex/dist/katex.min.css";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/articles";
import { LiveSessionProvider } from "@/components/live/session-context";
import Stage from "@/components/live/stage";
import Roster from "@/components/live/roster";

export default async function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if ((await getRole(supabase)) !== "admin") notFound();

  const { data: session } = await supabase
    .from("sessions")
    .select("slug, join_code, status, board, board_view")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();
  if (session.status === "ended") redirect(`/dashboard/sessions/${id}/report`);

  let Article: React.ComponentType;
  try {
    ({ default: Article } = await import(`@/content/articles/${session.slug}.mdx`));
  } catch {
    notFound();
  }

  return (
    <LiveSessionProvider mode="presenter" sessionId={id}>
      <div className="flex flex-col gap-4">
        <Roster joinCode={session.join_code} />
        <Stage
          mode="presenter"
          sessionId={id}
          initialView={session.board_view}
          initialScene={session.board}
        >
          <Article />
        </Stage>
      </div>
    </LiveSessionProvider>
  );
}

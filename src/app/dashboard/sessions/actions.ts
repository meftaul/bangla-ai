"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateJoinCode } from "@/lib/session";

// Admin starts a live session for an article. RLS rejects non-admins on the insert.
export async function startSession(formData: FormData) {
  const slug = String(formData.get("slug"));
  if (!slug) redirect("/dashboard/sessions?error=slug");

  const supabase = await createClient();
  // Ensure an articles row exists (FK target) without disturbing its status.
  await supabase.from("articles").upsert({ slug }, { onConflict: "slug", ignoreDuplicates: true });

  // Retry on the (rare) join_code collision.
  let id: string | undefined;
  for (let i = 0; i < 5 && !id; i++) {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ slug, join_code: generateJoinCode() })
      .select("id")
      .single();
    if (data) id = data.id;
    else if (error && error.code !== "23505") redirect("/dashboard/sessions?error=start");
  }
  if (!id) redirect("/dashboard/sessions?error=start");

  redirect(`/dashboard/sessions/${id}/present`);
}

// Presenter ends the session for everyone (called from the client after broadcasting).
export async function endSession(sessionId: string) {
  const supabase = await createClient();
  await supabase
    .from("sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
}

// Student joins by code. Logs a participation row, then opens the live deck.
export async function joinSession(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) redirect("/dashboard/live?error=empty");

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("join_code", code)
    .eq("status", "live")
    .maybeSingle();
  if (!session) redirect("/dashboard/live?error=notfound");

  // One row per join event (the honest log); roster liveness comes from presence.
  // Stamp the student's own email so the admin report can name them.
  const { data: auth } = await supabase.auth.getUser();
  await supabase
    .from("session_participants")
    .insert({ session_id: session.id, email: auth.user?.email });
  redirect(`/dashboard/sessions/${session.id}/live`);
}

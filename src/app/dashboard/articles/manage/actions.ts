"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STATUSES, type Status } from "@/lib/articles";

export async function setStatus(formData: FormData) {
  const slug = String(formData.get("slug"));
  const status = String(formData.get("status")) as Status;
  if (!slug || !STATUSES.includes(status)) return;

  const supabase = await createClient();
  // RLS rejects this write for non-admins.
  await supabase
    .from("articles")
    .upsert({ slug, status, updated_at: new Date().toISOString() });

  revalidatePath("/dashboard/articles", "layout");
}

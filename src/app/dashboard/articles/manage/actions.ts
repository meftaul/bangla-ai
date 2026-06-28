"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STATUSES, type Status } from "@/lib/articles";

export async function setStatus(formData: FormData) {
  const slug = String(formData.get("slug"));
  const status = String(formData.get("status")) as Status;
  // Same toggle drives items and courses; pick the table from the hidden field.
  const table = String(formData.get("kind")) === "course" ? "courses" : "articles";
  if (!slug || !STATUSES.includes(status)) return;

  const supabase = await createClient();
  // RLS rejects this write for non-admins.
  await supabase
    .from(table)
    .upsert({ slug, status, updated_at: new Date().toISOString() });

  revalidatePath("/dashboard/articles", "layout");
}

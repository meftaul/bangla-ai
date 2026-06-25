import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — Bangla.AI",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email as string | undefined;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as {email}.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <p className="text-foreground">Your dashboard is ready.</p>
        <p className="mt-1 text-sm text-muted">
          Courses, notebooks, and projects will show up here.
        </p>
      </div>
    </div>
  );
}

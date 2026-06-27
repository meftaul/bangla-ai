import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/articles";
import DashboardShell from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // Run the claims check and the role lookup concurrently — they're independent
  // round-trips; serial awaits added a needless RTT to every dashboard page.
  const [{ data }, role] = await Promise.all([
    supabase.auth.getClaims(),
    getRole(supabase),
  ]);

  if (!data) redirect("/login");
  const email = data.claims.email as string | undefined;
  const isAdmin = role === "admin";

  return (
    <DashboardShell isAdmin={isAdmin} email={email}>
      {children}
    </DashboardShell>
  );
}

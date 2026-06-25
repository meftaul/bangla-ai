import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) redirect("/login");
  const email = data.claims.email as string | undefined;

  return (
    <div className="flex min-h-[100dvh]">
      <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-border bg-surface px-5 py-6">
        <Link
          href="/dashboard"
          className="font-display text-xl font-bold tracking-tight text-foreground"
          aria-label="Bangla.AI dashboard"
        >
          Bangla<span className="text-accent-text">.</span>AI
        </Link>

        <div className="flex flex-col gap-3">
          <p className="truncate text-sm text-muted" title={email}>
            {email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}

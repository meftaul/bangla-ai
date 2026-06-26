import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import ThemeToggle from "../theme-toggle";
import { getRole } from "@/lib/articles";
import { FormPendingOverlay } from "@/components/loading-overlay";
import MobileNav from "./mobile-nav";
import { navLinks } from "./nav-links";

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
  const links = navLinks(isAdmin);

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      {/* Desktop sidebar (lg+) */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-border bg-surface px-5 py-6 lg:flex print:hidden">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="font-display text-xl font-bold tracking-tight text-foreground"
            aria-label="Bangla.AI dashboard"
          >
            Bangla<span className="text-accent-text">.</span>AI
          </Link>
          <ThemeToggle />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <p className="truncate text-sm text-muted" title={email}>
            {email}
          </p>
          <form action={signOut}>
            <FormPendingOverlay />
            <button type="submit" className="btn-secondary w-full">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar + drawer (below lg) */}
      <MobileNav isAdmin={isAdmin} email={email} />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}

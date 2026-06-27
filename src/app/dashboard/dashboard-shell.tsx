"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import ThemeToggle from "../theme-toggle";
import { FormPendingOverlay } from "@/components/loading-overlay";
import { LogoLockup } from "@/components/logo";
import { signOut } from "../login/actions";
import { navLinks } from "./nav-links";

const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

// Unified dashboard chrome: one top bar + one sidebar driven by a single
// hamburger toggle. Sidebar is an inline column on desktop (lg+) and a slide-in
// overlay drawer below lg. Auth stays in the server layout, which renders this.
export default function DashboardShell({
  isAdmin,
  email,
  children,
}: {
  isAdmin: boolean;
  email?: string;
  children: React.ReactNode;
}) {
  // Tri-state: null = untouched (CSS default — visible on desktop, hidden on
  // mobile, no hydration flash). true/false set explicitly once toggled.
  const [open, setOpen] = useState<boolean | null>(null);
  const pathname = usePathname();
  const links = navLinks(isAdmin);

  // Escape-to-close + body-scroll-lock, but only while the mobile overlay is up.
  // On desktop the sidebar is inline, so locking scroll would be wrong.
  useEffect(() => {
    if (open !== true) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const lock = !isDesktop();
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (lock) document.body.style.overflow = prev;
    };
  }, [open]);

  // From the null default, the first click flips against the current breakpoint
  // (desktop is showing → hide; mobile is hidden → show); after that it's a
  // plain boolean toggle.
  const toggle = () =>
    setOpen((o) => (o === null ? !isDesktop() : !o));

  // Nav clicks dismiss the mobile drawer but leave the desktop sidebar in place.
  const onNavClick = () => {
    if (!isDesktop()) setOpen(false);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Top bar (all breakpoints) */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md print:hidden">
        <Link href="/dashboard" aria-label="Bangla.AI dashboard">
          <LogoLockup className="text-lg text-foreground" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle menu"
            aria-expanded={open === true}
            className="grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-surface"
          >
            <List size={22} weight="bold" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Mobile overlay backdrop */}
        <div
          className={`fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-200 motion-reduce:transition-none lg:hidden print:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setOpen(false)}
          aria-hidden={open !== true}
        />

        {/* Sidebar: inline on lg+, slide-in drawer below lg */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between border-l border-border bg-surface px-5 py-5 transition-transform duration-200 ease-out motion-reduce:transition-none lg:static lg:inset-auto lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0 lg:border-l-0 lg:border-r lg:py-6 print:hidden ${
            open ? "translate-x-0" : "translate-x-full"
          } ${open === false ? "lg:hidden" : "lg:flex"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div>
            {/* Close button — only meaningful for the mobile drawer */}
            <div className="flex justify-end lg:hidden">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-background hover:text-foreground"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <nav className="mt-2 flex flex-col gap-1 lg:mt-0">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavClick}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent/10 text-accent-text"
                        : "text-foreground hover:bg-background"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            {email && (
              <p className="truncate text-sm text-muted" title={email}>
                {email}
              </p>
            )}
            <form action={signOut}>
              <FormPendingOverlay />
              <button type="submit" className="btn-secondary w-full">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import ThemeToggle from "../theme-toggle";
import { FormPendingOverlay } from "@/components/loading-overlay";
import { signOut } from "../login/actions";
import { navLinks } from "./nav-links";

// Mobile-only top bar + slide-in drawer. The desktop sidebar (server-rendered
// in layout.tsx) is hidden below lg; this covers small screens. Drawer state is
// client-side, so this lives outside the server layout.
export default function MobileNav({
  isAdmin,
  email,
}: {
  isAdmin: boolean;
  email?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = navLinks(isAdmin);

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden print:hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md">
        <Link
          href="/dashboard"
          className="font-display text-lg font-bold tracking-tight text-foreground"
          aria-label="Bangla.AI dashboard"
        >
          Bangla<span className="text-accent-text">.</span>AI
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-surface"
          >
            <List size={22} weight="bold" />
          </button>
        </div>
      </div>

      {/* Overlay + drawer */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between border-l border-border bg-surface px-5 py-5 transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Bangla<span className="text-accent-text">.</span>AI
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-background hover:text-foreground"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
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
    </div>
  );
}

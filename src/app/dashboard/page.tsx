import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, PencilSimple, Broadcast, Television, ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/articles";
import { navLinks } from "./nav-links";

export const metadata: Metadata = {
  title: "Dashboard — Bangla.AI",
};

const ICONS = {
  "/dashboard/articles": BookOpen,
  "/dashboard/articles/manage": PencilSimple,
  "/dashboard/sessions": Broadcast,
  "/dashboard/live": Television,
  "/dashboard/my-sessions": ClockCounterClockwise,
} as const;

const BLURBS: Record<string, string> = {
  "/dashboard/articles": "Read every course and notebook.",
  "/dashboard/articles/manage": "Publish, draft, or archive content.",
  "/dashboard/sessions": "Run a synced deck and score the room.",
  "/dashboard/live": "Enter a code and follow along in real time.",
  "/dashboard/my-sessions": "Revisit past sessions and your scores.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data }, role] = await Promise.all([
    supabase.auth.getClaims(),
    getRole(supabase),
  ]);
  const email = data?.claims.email as string | undefined;
  const isAdmin = role === "admin";

  const cards = navLinks(isAdmin).map((l) => ({ ...l, blurb: BLURBS[l.href] }));

  const name = email?.split("@")[0];

  return (
    <div className="max-w-4xl">
      <p className="font-bangla text-base font-semibold text-accent-text">স্বাগতম</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        Welcome back{name ? <span className="text-accent-text">, {name}</span> : ""}.
      </h1>
      <p className="mt-3 max-w-prose text-base leading-relaxed text-muted">
        Pick up where you left off, or jump into something new.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card, i) => {
          const Icon = ICONS[card.href as keyof typeof ICONS];
          // First card spans both columns on sm+ for bento rhythm.
          const wide = i === 0 ? "sm:col-span-2" : "";
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`surface-card group flex flex-col justify-between gap-6 p-6 transition-all hover:-translate-y-0.5 hover:border-accent ${wide}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent-text">
                <Icon size={22} weight="bold" />
              </span>
              <span className="flex items-end justify-between gap-4">
                <span>
                  <span className="block font-display text-lg font-semibold text-foreground">
                    {card.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{card.blurb}</span>
                </span>
                <ArrowRight
                  size={20}
                  weight="bold"
                  className="shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent-text"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

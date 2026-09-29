"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { railNet, type RailNet } from "@/content/rail";

// Which stations are open (published), handed down from the article page so a
// journey rides the same network the route map shows. Without it, the journey
// is not on the railway: a draft, or a page outside the course.

const OpenCtx = createContext<readonly string[] | null>(null);

export function RailOpen({ slugs, children }: { slugs: readonly string[]; children: ReactNode }) {
  return <OpenCtx value={slugs}>{children}</OpenCtx>;
}

/** The railway as it runs for this page, or null off the railway. */
export function useRailNet(): RailNet | null {
  const slugs = useContext(OpenCtx);
  return useMemo(() => (slugs ? railNet(new Set(slugs)) : null), [slugs]);
}

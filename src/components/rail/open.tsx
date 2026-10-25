"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { railNet, type RailNet } from "@/content/rail";

// Which course's railway, and which of its stations are open (published),
// handed down from the article page so a journey rides the same network the
// route map shows. Without it, the journey
// is not on the railway: a draft, or a page outside the course.

const OpenCtx = createContext<{ course: string; slugs: readonly string[] } | null>(null);

export function RailOpen({ course, slugs, children }: { course: string; slugs: readonly string[]; children: ReactNode }) {
  const value = useMemo(() => ({ course, slugs }), [course, slugs]);
  return <OpenCtx value={value}>{children}</OpenCtx>;
}

/** The railway as it runs for this page, or null off the railway. */
export function useRailNet(): RailNet | null {
  const open = useContext(OpenCtx);
  return useMemo(() => (open ? railNet(open.course, new Set(open.slugs)) : null), [open]);
}

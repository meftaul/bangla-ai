import {
  BookOpen,
  Broadcast,
  ClockCounterClockwise,
  House,
  PencilSimple,
  Television,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

// Shared dashboard nav so the desktop sidebar, mobile drawer, and the home page's
// quick links can't drift — icon + blurb live here too, one source for all three.
export type NavLink = { href: string; label: string; icon: Icon; blurb: string };

export function navLinks(isAdmin: boolean): NavLink[] {
  const links: NavLink[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: House,
      blurb: "Your home base and recent activity.",
    },
    {
      href: "/dashboard/articles",
      label: "Library",
      icon: BookOpen,
      blurb: "Read every course, article, and deck.",
    },
  ];
  if (isAdmin) {
    links.push(
      {
        href: "/dashboard/articles/manage",
        label: "Manage library",
        icon: PencilSimple,
        blurb: "Publish or draft articles, decks, and courses.",
      },
      {
        href: "/dashboard/sessions",
        label: "Live sessions",
        icon: Broadcast,
        blurb: "Run a synced deck and score the room.",
      },
    );
  } else {
    links.push(
      {
        href: "/dashboard/live",
        label: "Join live",
        icon: Television,
        blurb: "Enter a code and follow along in real time.",
      },
      {
        href: "/dashboard/my-sessions",
        label: "My sessions",
        icon: ClockCounterClockwise,
        blurb: "Revisit past sessions and your scores.",
      },
    );
  }
  return links;
}

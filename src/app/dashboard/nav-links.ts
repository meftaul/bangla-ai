// Shared dashboard nav so the desktop sidebar and mobile drawer can't drift.
export type NavLink = { href: string; label: string };

export function navLinks(isAdmin: boolean): NavLink[] {
  const links: NavLink[] = [{ href: "/dashboard/articles", label: "Articles" }];
  if (isAdmin) {
    links.push(
      { href: "/dashboard/articles/manage", label: "Manage articles" },
      { href: "/dashboard/sessions", label: "Live sessions" },
    );
  } else {
    links.push(
      { href: "/dashboard/live", label: "Join live" },
      { href: "/dashboard/my-sessions", label: "My sessions" },
    );
  }
  return links;
}

"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "@phosphor-icons/react/dist/ssr";

function subscribe(cb: () => void) {
  window.addEventListener("theme-change", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("theme-change", cb);
    window.removeEventListener("storage", cb);
  };
}

function getTheme(): "light" | "dark" {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// ponytail: 2-state toggle (light/dark); defaults to system on first load,
// then persists the explicit choice. No-flash applied by the inline script in layout.
// localStorage is the store; useSyncExternalStore reads it without an effect.
export default function ThemeToggle() {
  // server snapshot is undefined → renders the placeholder until hydrated (no flash).
  const theme = useSyncExternalStore(subscribe, getTheme, () => undefined);

  function toggle() {
    const next = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    localStorage.setItem("theme", next);
    window.dispatchEvent(new Event("theme-change"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className="grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      {theme === "dark" ? (
        <Sun size={18} weight="bold" />
      ) : theme === "light" ? (
        <Moon size={18} weight="bold" />
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

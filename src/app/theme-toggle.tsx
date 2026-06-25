"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "@phosphor-icons/react/dist/ssr";

// ponytail: 2-state toggle (light/dark); defaults to system on first load,
// then persists the explicit choice. No-flash applied by the inline script in layout.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    setTheme(
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
    );
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    localStorage.setItem("theme", next);
    setTheme(next);
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

import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "theme";

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Theme | null;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    const initial: Theme = saved === "dark" || saved === "light" ? saved : prefersDark ? "dark" : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial === "dark" ? "dark" : "light";
  }, []);

  const toggle = useMemo(
    () => () => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      setTheme(next);
      localStorage.setItem(storageKey, next);
      document.documentElement.dataset.theme = next === "dark" ? "dark" : "light";
    },
    [theme]
  );

  return { theme, toggle };
}


import { useState, useEffect } from "react";

export type Theme = "ambient" | "terminal" | "grid";

const STORAGE_KEY = "bcc-bin-days-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "ambient";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}

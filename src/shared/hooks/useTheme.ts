"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { DARK_THEME_ENABLED, THEME_STORAGE_KEY } from "@/shared/utils/constants";
import { resolveTheme, type Theme } from "@/shared/utils/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();
/** Choix de la session quand le stockage est indisponible. */
let sessionChoice: Theme | null = null;

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Theme {
  return resolveTheme({
    stored: readStored() ?? sessionChoice,
    systemPrefersDark: window.matchMedia(DARK_QUERY).matches,
    darkEnabled: DARK_THEME_ENABLED,
  });
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    mql.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Thème courant (`light | dark`) et commandes. Le choix manuel est mémorisé ; sans choix,
 * le thème suit `prefers-color-scheme`. Renvoie `light` côté serveur et tant que
 * `DARK_THEME_ENABLED` est faux.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, (): Theme => "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    if (!DARK_THEME_ENABLED) return;
    sessionChoice = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // stockage indisponible : le choix vaut pour la session seulement
    }
    listeners.forEach((l) => l());
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(getSnapshot() === "dark" ? "light" : "dark"),
    [setTheme],
  );

  return { theme, setTheme, toggleTheme, darkEnabled: DARK_THEME_ENABLED };
}

"use client";

import { useSyncExternalStore } from "react";

/**
 * Suit une media query CSS (ex. `(min-width: 768px)`).
 * Renvoie `false` côté serveur, puis la vraie valeur une fois hydraté.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

import { DARK_THEME_ENABLED, THEME_STORAGE_KEY } from "./constants";

export type Theme = "light" | "dark";

/** Valide une valeur lue hors de notre contrôle (localStorage) : `null` si inconnue. */
export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

interface ResolveThemeInput {
  /** Valeur brute mémorisée (potentiellement corrompue). */
  stored: unknown;
  systemPrefersDark: boolean;
  darkEnabled: boolean;
}

/** Thème effectif : clair forcé si le sombre n'est pas exposé, sinon choix mémorisé, sinon système. */
export function resolveTheme({ stored, systemPrefersDark, darkEnabled }: ResolveThemeInput): Theme {
  if (!darkEnabled) return "light";
  return parseTheme(stored) ?? (systemPrefersDark ? "dark" : "light");
}

/**
 * Script inline exécuté avant le premier rendu pour éviter le flash de thème.
 * Constant (aucune donnée utilisateur) ; reprend la logique de `resolveTheme`.
 * Lecture du stockage protégée : indisponible (mode privé) → thème système.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement,t="light";if(${JSON.stringify(
  DARK_THEME_ENABLED,
)}){var s=null;try{s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}d.setAttribute("data-theme",t)}catch(e){}})();`;

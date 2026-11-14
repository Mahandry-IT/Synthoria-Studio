"use client";

import { useSyncExternalStore } from "react";
import type { Theme } from "@/shared/utils/theme";

/** Thème porté par l'attribut `data-theme` de `<html>` (posé par le script anti-flash puis par `useTheme`). */
export function themeFromAttribute(value: string | null | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}

// Un seul observateur partagé par tous les blocs thématiques de la page.
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

export function subscribe(onChange: () => void): () => void {
  if (!observer) {
    observer = new MutationObserver(() => listeners.forEach((l) => l()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

const getSnapshot = (): Theme => themeFromAttribute(document.documentElement.getAttribute("data-theme"));
const getServerSnapshot = (): Theme => "light";

/**
 * Thème effectivement appliqué au document, suivi en direct. Sert aux rendus qui exigent des couleurs
 * littérales (Mermaid, graphiques SVG, document d'un widget) et ne peuvent pas lire les variables CSS.
 * Clair côté serveur ; se met à jour à chaque changement de `data-theme`.
 */
export function useDocumentTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

/**
 * Hash courant de l'URL. Le routeur Next change le hash via `pushState` (aucun événement) :
 * `refresh()` relit l'URL après un clic sur un lien de la navigation.
 */
export function useLocationHash(): { hash: string; refresh: () => void } {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const refresh = useCallback(() => {
    // après le pushState du routeur, qui peut prendre plus d'un tick : relectures successives
    for (const delay of [0, 60, 250, 700]) setTimeout(() => listeners.forEach((l) => l()), delay);
  }, []);
  return { hash, refresh };
}

"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook générique persistant en sessionStorage.
 * Survit au refresh de page mais pas à la fermeture de l'onglet.
 *
 * @param key - Clé de sessionStorage
 * @param initialValue - Valeur initiale si rien en sessionStorage
 */
export function useSessionStorageState<T>(
  key: string,
  initialValue: T | null,
): [T | null, (value: T | null) => void] {
  const [state, setState] = useState<T | null>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Persister à chaque changement
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (state === null) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(state));
      }
    } catch {
      // sessionStorage plein ou indisponible (mode privé) — silencieux
    }
  }, [key, state]);

  const setValue = useCallback((value: T | null) => {
    setState(value);
  }, []);

  return [state, setValue];
}

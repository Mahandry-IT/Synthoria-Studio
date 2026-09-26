"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook générique persistant en localStorage.
 * Survit au refresh de page ET à la fermeture du navigateur (contrairement à sessionStorage).
 *
 * @param key - Clé de localStorage
 * @param initialValue - Valeur initiale si rien en localStorage
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T | null,
): [T | null, (value: T | null) => void] {
  const [state, setState] = useState<T | null>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = localStorage.getItem(key);
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
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch {
      // localStorage plein ou indisponible (mode privé) — silencieux
    }
  }, [key, state]);

  const setValue = useCallback((value: T | null) => {
    setState(value);
  }, []);

  return [state, setValue];
}

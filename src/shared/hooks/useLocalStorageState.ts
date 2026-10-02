"use client";

import { useStorageState } from "./useStorageState";

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
  return useStorageState<T>("local", key, initialValue);
}

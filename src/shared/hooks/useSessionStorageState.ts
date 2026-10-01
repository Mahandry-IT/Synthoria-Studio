"use client";

import { useStorageState } from "./useStorageState";

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
  return useStorageState<T>("session", key, initialValue);
}

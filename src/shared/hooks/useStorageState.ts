"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

export type StorageKind = "local" | "session";

const listeners = new Set<() => void>();
/** Repli quand le stockage du navigateur est indisponible (mode privé, quota) : l'état survit au moins en mémoire. */
const memory = new Map<string, string>();

function getStorage(kind: StorageKind): Storage | null {
  try {
    return kind === "local" ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

function readRaw(kind: StorageKind, key: string): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? memory.get(`${kind}:${key}`) ?? null;
  } catch {
    return memory.get(`${kind}:${key}`) ?? null;
  }
}

function writeRaw(kind: StorageKind, key: string, raw: string | null): void {
  const memoryKey = `${kind}:${key}`;
  if (raw === null) memory.delete(memoryKey);
  else memory.set(memoryKey, raw);
  try {
    const storage = getStorage(kind);
    if (raw === null) storage?.removeItem(key);
    else storage?.setItem(key, raw);
  } catch {
    // stockage plein ou indisponible : l'état reste en mémoire
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * État persisté dans le localStorage ou le sessionStorage, compatible rendu serveur.
 * Le serveur et le premier rendu client voient `initialValue` (sinon le HTML hydraté diffère :
 * erreur React #418) ; la valeur stockée s'applique juste après l'hydratation.
 */
export function useStorageState<T>(
  kind: StorageKind,
  key: string,
  initialValue: T | null,
): [T | null, (value: T | null) => void] {
  const [initial] = useState(initialValue);
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(kind, key),
    () => null,
  );

  const state = useMemo<T | null>(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);

  const setValue = useCallback(
    (value: T | null) => writeRaw(kind, key, value === null ? null : JSON.stringify(value)),
    [kind, key],
  );

  return [state, setValue];
}

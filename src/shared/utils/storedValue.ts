/**
 * Magasin minimal pour `useSyncExternalStore` : la valeur vit en mémoire (repli si le stockage est
 * indisponible : navigation privée, quota) et est recopiée dans localStorage.
 * `parse` reçoit la chaîne stockée (ou `null`) et renvoie la valeur à utiliser.
 */
export function createStoredValue<T>(key: string, parse: (raw: string | null) => T, serialize: (value: T) => string) {
  let memory: { value: T } | null = null;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read(): T {
      if (memory) return memory.value;
      try {
        return parse(window.localStorage.getItem(key));
      } catch {
        return parse(null);
      }
    },
    write(value: T): void {
      memory = { value };
      try {
        window.localStorage.setItem(key, serialize(value));
      } catch {
        // Stockage indisponible : seule la mémoire de la page est conservée
      }
      listeners.forEach((listener) => listener());
    },
  };
}

/** Nombre d'indices affichés après un clic sur « Indice suivant » (borné au total). */
export function nextHintCount(revealed: number, total: number): number {
  return Math.min(Math.max(0, revealed) + 1, Math.max(0, total));
}

/** Indices visibles, du plus général au plus précis (ordre du serveur). */
export function visibleHints(hints: readonly string[], revealed: number): string[] {
  return hints.slice(0, Math.max(0, revealed));
}

export function hasMoreHints(hints: readonly string[], revealed: number): boolean {
  return revealed < hints.length;
}

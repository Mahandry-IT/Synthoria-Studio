import { useState } from "react";

/**
 * Navigation dans le pas-à-pas d'un graphe.
 * @param total - nombre d'étapes (0 = schéma statique, l'index reste à 0)
 */
export function useGraphSteps(total: number) {
  const [index, setIndex] = useState(0);
  const last = Math.max(total - 1, 0);
  const current = Math.min(index, last);

  return {
    index: current,
    isFirst: current === 0,
    isLast: current === last,
    next: () => setIndex(Math.min(current + 1, last)),
    previous: () => setIndex(Math.max(current - 1, 0)),
    reset: () => setIndex(0),
  };
}

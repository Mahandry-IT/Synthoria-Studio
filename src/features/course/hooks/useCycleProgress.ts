"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSessionStorageState } from "@/shared/hooks/useSessionStorageState";
import { sanitizeCycleProgress, updateFromLatest, type CycleProgress } from "../cycleProgress";

/**
 * Progression fine des sections « cycle » (mini-étapes, réponses), en sessionStorage.
 * `update` applique une transition pure de `cycleProgress.ts` ; la valeur lue est assainie
 * (stockage corrompu ou ancien : repart d'une progression vide, sans erreur).
 */
export function useCycleProgress(courseKey: string) {
  const [stored, setStored] = useSessionStorageState<unknown>(`cycle-progress:${courseKey}`, null);
  const progress = useMemo<CycleProgress>(() => sanitizeCycleProgress(stored), [stored]);
  // Dernière valeur écrite : deux mises à jour avant le re-rendu se composent au lieu de s'écraser.
  const latest = useRef(progress);
  useEffect(() => {
    latest.current = progress;
  }, [progress]);
  const update = useCallback(
    (transition: (current: CycleProgress) => CycleProgress) => updateFromLatest(latest, transition, setStored),
    [setStored],
  );
  return { cycleProgress: progress, updateCycle: update };
}

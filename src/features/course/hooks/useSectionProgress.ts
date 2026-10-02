"use client";

import { useCallback } from "react";
import { useSessionStorageState } from "@/shared/hooks/useSessionStorageState";
import { completeSection, EMPTY_PROGRESS, unlockSection, type SectionProgress } from "../sectionProgress";

/**
 * Progression par section, conservée en sessionStorage (survit au rafraîchissement, pas à la
 * fermeture de l'onglet). `courseKey` identifie le cours (id de session, à défaut son titre).
 *
 * `update` applique une transition pure de `sectionProgress.ts` : pour enchaîner deux transitions
 * dans le même événement, les composer en un seul appel (sinon la seconde écrase la première).
 */
export function useSectionProgress(courseKey: string) {
  const [stored, setStored] = useSessionStorageState<SectionProgress>(`section-progress:${courseKey}`, null);
  const progress = stored ?? EMPTY_PROGRESS;

  const update = useCallback(
    (transition: (current: SectionProgress) => SectionProgress) => setStored(transition(progress)),
    [progress, setStored],
  );
  const unlock = useCallback((id: string) => update((p) => unlockSection(p, id)), [update]);
  const complete = useCallback((id: string) => update((p) => completeSection(p, id)), [update]);

  return { progress, update, unlock, complete };
}

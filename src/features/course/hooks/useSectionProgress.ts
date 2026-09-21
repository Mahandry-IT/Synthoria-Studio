"use client";

import { useCallback } from "react";
import { useSessionStorageState } from "@/shared/hooks/useSessionStorageState";
import { completeSection, EMPTY_PROGRESS, unlockSection, type SectionProgress } from "../sectionProgress";

/**
 * Progression par section, conservée en sessionStorage (survit au rafraîchissement, pas à la
 * fermeture de l'onglet). `courseKey` identifie le cours (id de session, à défaut son titre).
 */
export function useSectionProgress(courseKey: string) {
  const [stored, setStored] = useSessionStorageState<SectionProgress>(`section-progress:${courseKey}`, null);
  const progress = stored ?? EMPTY_PROGRESS;

  const unlock = useCallback((id: string) => setStored(unlockSection(progress, id)), [progress, setStored]);
  const complete = useCallback((id: string) => setStored(completeSection(progress, id)), [progress, setStored]);

  return { progress, unlock, complete };
}

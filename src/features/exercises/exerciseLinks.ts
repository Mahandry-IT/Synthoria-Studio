import type { ExerciseList, ExerciseSummary } from "./exercise.types";

/**
 * Table section_id → exercice, seulement quand la liste est à l'état « done » (RG-7) :
 * en cours, échouée ou absente, aucune section n'a de bouton. Un exercice sans section est ignoré ;
 * si plusieurs visent la même section, le premier par position l'emporte.
 */
export function buildSectionExerciseMap(list: ExerciseList | undefined): ReadonlyMap<string, ExerciseSummary> {
  const map = new Map<string, ExerciseSummary>();
  if (list?.status !== "done") return map;
  for (const exercise of [...list.exercises].sort((a, b) => a.position - b.position)) {
    if (exercise.section_id && !map.has(exercise.section_id)) map.set(exercise.section_id, exercise);
  }
  return map;
}

/** Id DOM d'ancrage d'une section (cible de « Retour à la section »). */
export const sectionAnchorId = (sectionId: string) => `section-anchor-${sectionId}`;

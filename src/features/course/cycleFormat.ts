import type { CourseSection, SectionCycle } from "./course.types";

/** Les temps d'une section « cycle », dans l'ordre. */
export type CycleStageKey = "challenge" | "steps" | "vocabulary" | "traps" | "trial";

/** Titres fixes affichés (jamais Pourquoi / Quoi / Comment). */
export const CYCLE_STAGE_TITLES: Readonly<Record<CycleStageKey, string>> = {
  challenge: "Défi",
  steps: "Sous le capot",
  vocabulary: "Le mot juste",
  traps: "Les pièges classiques",
  trial: "Épreuve",
};

/**
 * Une section utilise le lecteur « cycle » si elle porte un cycle exploitable et n'est pas incomplète
 * (une section incomplète garde le bouton de régénération du lecteur historique).
 */
export function hasCycle(section: Pick<CourseSection, "cycle" | "incomplete">): boolean {
  return Boolean(section.cycle) && !section.incomplete;
}

/** Temps présents dans le cycle, dans l'ordre ; un temps absent est sauté. */
export function cycleStages(section: { cycle?: SectionCycle }): CycleStageKey[] {
  const cycle = section.cycle;
  if (!cycle) return [];
  const stages: CycleStageKey[] = ["challenge"];
  if (cycle.steps.length > 0) stages.push("steps");
  if (cycle.vocabulary.length > 0) stages.push("vocabulary");
  if (cycle.traps && cycle.traps.entries.length > 0) stages.push("traps");
  if (cycle.trial) stages.push("trial");
  return stages;
}

/** Libellé annoncé du temps courant : « Temps n sur N · Titre » (n est borné à [1, N]). */
export function stageProgressLabel(revealed: number, total: number, key: CycleStageKey): string {
  const n = Math.min(Math.max(1, Math.round(revealed) || 1), Math.max(1, total));
  return `Temps ${n} sur ${Math.max(1, total)} · ${CYCLE_STAGE_TITLES[key]}`;
}

/** Présentation d'un temps dévoilé : « courant » (dernier dévoilé, section en cours) ou « fait » (franchi, ou section terminée). */
export type StageView = "done" | "current";

export function stageView(position: number, revealed: number, sectionDone: boolean): StageView {
  return !sectionDone && position === revealed - 1 ? "current" : "done";
}

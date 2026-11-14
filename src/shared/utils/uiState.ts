/** Logique pure des composants de progression, d'étapes et de champs (testable sans DOM). */

export type StepState = "done" | "current" | "todo";

const safeMax = (max: number) => (Number.isFinite(max) && max > 0 ? max : 100);

/** Valeur bornée dans [0, max] (`aria-valuenow`) ; `undefined` si absente ou invalide (barre indéterminée). */
export function progressNow(value: number | null | undefined, max = 100): number | undefined {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(safeMax(max), Math.max(0, value));
}

/** Pourcentage 0-100 de remplissage ; `undefined` pour une barre indéterminée. */
export function progressPercent(value: number | null | undefined, max = 100): number | undefined {
  const now = progressNow(value, max);
  return now === undefined ? undefined : (now / safeMax(max)) * 100;
}

/** État de l'étape `step` (1 à `total`) quand l'étape courante est `current` (bornée à [1, total]). */
export function stepState(step: number, current: number, total: number): StepState {
  const cur = Math.min(Math.max(1, Math.round(current) || 1), Math.max(1, total));
  if (step < cur) return "done";
  return step === cur ? "current" : "todo";
}

export const STEP_STATE_LABEL: Record<StepState, string> = {
  done: "terminée",
  current: "en cours",
  todo: "à venir",
};

interface FieldAriaInput {
  id: string;
  help?: unknown;
  error?: unknown;
}

/** Ids et attributs ARIA d'un champ : `aria-describedby` référence l'aide et l'erreur présentes. */
export function fieldAria({ id, help, error }: FieldAriaInput) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  return { helpId, errorId, describedBy, invalid: error ? (true as const) : undefined };
}

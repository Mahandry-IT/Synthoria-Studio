/**
 * Progression fine d'une section « cycle », conservée en sessionStorage (par cours).
 * Les temps dévoilés (Défi → … → Épreuve) et la fin de section réutilisent `SectionProgress`
 * (`revealed`, `done`) : la navigation affiche ainsi le même état « faite / en cours / à faire ».
 * Ce module ne garde que ce qui est propre au cycle : mini-étapes de « Sous le capot » dévoilées et
 * réponses données (pour reprendre après un rafraîchissement). Rien n'est noté.
 */

/** Réponse mémorisée à une interaction ; tous les champs sont optionnels (lecture tolérante). */
export interface CycleAnswerRecord {
  /** Indices cochés ou choisis. */
  picked?: number[];
  /** Valeur saisie (prédiction ou question numérique) ; null = vide. */
  value?: number | null;
  /** « Je ne sais pas » / passé. */
  skipped?: boolean;
  /** Résultat de vérification (actions, pièges). */
  correct?: boolean;
}

export interface CycleSectionState {
  /** Mini-étapes dévoilées (au moins 1). */
  steps?: number;
  answers?: Record<string, CycleAnswerRecord>;
}

/** Progression de tous les cycles d'un cours, par clé de section (`sectionKey`). */
export type CycleProgress = Record<string, CycleSectionState>;

export const EMPTY_CYCLE_PROGRESS: CycleProgress = {};

/** Clés de réponse, une par interaction. */
export const answerKey = {
  challenge: "challenge",
  prediction: (step: number) => `step-${step}-prediction`,
  action: (step: number) => `step-${step}-action`,
  trapSpot: (entry: number) => `trap-${entry}-spot`,
  trapRewrite: (entry: number) => `trap-${entry}-rewrite`,
  trapCard: (entry: number) => `trap-${entry}-card`,
  trial: (question: number) => `trial-${question}`,
  trialCard: "trial-card",
} as const;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function sanitizeRecord(raw: unknown): CycleAnswerRecord | null {
  if (!isObject(raw)) return null;
  const record: CycleAnswerRecord = {};
  if (Array.isArray(raw.picked) && raw.picked.every((i) => Number.isInteger(i) && i >= 0)) record.picked = raw.picked as number[];
  if (raw.value === null || (typeof raw.value === "number" && Number.isFinite(raw.value))) record.value = raw.value as number | null;
  if (typeof raw.skipped === "boolean") record.skipped = raw.skipped;
  if (typeof raw.correct === "boolean") record.correct = raw.correct;
  return record;
}

/** Lecture tolérante d'une valeur stockée : tout ce qui est invalide est écarté, jamais d'exception. */
export function sanitizeCycleProgress(raw: unknown): CycleProgress {
  if (!isObject(raw)) return {};
  const progress: CycleProgress = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isObject(value)) continue;
    const state: CycleSectionState = {};
    if (typeof value.steps === "number" && Number.isInteger(value.steps) && value.steps >= 1) state.steps = value.steps;
    if (isObject(value.answers)) {
      const answers: Record<string, CycleAnswerRecord> = {};
      for (const [answer, record] of Object.entries(value.answers)) {
        const clean = sanitizeRecord(record);
        if (clean) answers[answer] = clean;
      }
      state.answers = answers;
    }
    progress[key] = state;
  }
  return progress;
}

/** Mini-étapes dévoilées : au moins la première, au plus `total` ; toutes si la section est déjà passée. */
export function revealedMiniSteps(progress: CycleProgress, key: string, total: number, showAll = false): number {
  if (total <= 0) return 0;
  if (showAll) return total;
  return Math.min(Math.max(progress[key]?.steps ?? 1, 1), total);
}

/** Dévoile la mini-étape suivante. */
export function revealNextMiniStep(progress: CycleProgress, key: string, total: number): CycleProgress {
  const next = Math.min(revealedMiniSteps(progress, key, total) + 1, Math.max(total, 1));
  return { ...progress, [key]: { ...progress[key], steps: next } };
}

export function getAnswer(progress: CycleProgress, key: string, id: string): CycleAnswerRecord | undefined {
  return progress[key]?.answers?.[id];
}

export function recordAnswer(progress: CycleProgress, key: string, id: string, record: CycleAnswerRecord): CycleProgress {
  const current = progress[key] ?? {};
  return { ...progress, [key]: { ...current, answers: { ...current.answers, [id]: record } } };
}

/**
 * Applique une transition à la DERNIÈRE valeur écrite (et non à celle capturée au rendu) : deux mises à
 * jour avant le re-rendu se composent au lieu de s'écraser.
 */
export function updateFromLatest<T>(latest: { current: T }, transition: (current: T) => T, write: (next: T) => void): void {
  const next = transition(latest.current);
  latest.current = next;
  write(next);
}

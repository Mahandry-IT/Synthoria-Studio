import type { CycleChallenge, StepPrediction, TrapEntry } from "./course.types";
import type { CycleAnswerRecord } from "./cycleProgress";
import { parseNumericInput } from "./quizGrading";

/** Tolérance minimale d'une prédiction numérique : même écart que la correction numérique du quiz. */
export const PREDICTION_DEFAULT_TOLERANCE = 0.0001;

/** Bonne réponse = ensemble exact des indices cochés (ordre et doublons ignorés). */
export function isExactSelection(expected: readonly number[], picked: readonly number[]): boolean {
  const given = new Set(picked);
  return expected.length > 0 && given.size === expected.length && expected.every((i) => given.has(i));
}

export const isChallengeCorrect = (challenge: Pick<CycleChallenge, "correct_indices">, picked: readonly number[]): boolean =>
  isExactSelection(challenge.correct_indices, picked);

/** Réponse à une prédiction : choix, valeur saisie (null = vide ou illisible) ou « je ne sais pas ». */
export type PredictionAnswer =
  | { kind: "choice"; index: number }
  | { kind: "value"; value: number | null }
  | { kind: "skip" };

export type PredictionVerdict = "correct" | "incorrect" | "skipped";

/** Saisie numérique : même lecture que le quiz (virgule ou point, espaces ignorés ; vide ou illisible → null). */
export const parseValueInput = parseNumericInput;

/**
 * Reprise après rafraîchissement : le stockage n'est lu qu'après l'hydratation, donc les états locaux
 * ne peuvent pas être initialisés depuis la réponse. Quand une réponse existe elle prime sur le brouillon
 * local ; sinon on affiche le brouillon.
 */
export const pickedOf = (answer: CycleAnswerRecord | undefined, draft: number[]): number[] => answer?.picked ?? draft;

/** Saisie affichée : la valeur mémorisée si elle existe, sinon le brouillon. */
export const valueTextOf = (answer: CycleAnswerRecord | undefined, draft: string): string =>
  typeof answer?.value === "number" ? String(answer.value) : draft;

/** Une valeur est juste si elle est à moins de `tolerance` (absolue) de la valeur attendue. */
export function isValueClose(expected: number, given: number, tolerance: number): boolean {
  const allowed = Math.max(tolerance, PREDICTION_DEFAULT_TOLERANCE);
  return Math.abs(given - expected) <= allowed + 1e-12;
}

/** Verdict d'une prédiction (jamais noté : sert seulement à formuler le retour). Une saisie vide vaut « je ne sais pas ». */
export function checkPrediction(prediction: StepPrediction, answer: PredictionAnswer): PredictionVerdict {
  if (answer.kind === "skip") return "skipped";
  if (answer.kind === "choice") return answer.index === prediction.correct_index ? "correct" : "incorrect";
  if (answer.value === null) return "skipped";
  if (prediction.expected_value === null) return "incorrect";
  return isValueClose(prediction.expected_value, answer.value, prediction.tolerance) ? "correct" : "incorrect";
}

/** `spot` : l'apprenant a-t-il repéré l'affirmation fausse ? */
export const isSpotCorrect = (entry: Pick<TrapEntry, "wrong_index">, picked: number): boolean =>
  entry.wrong_index !== null && picked === entry.wrong_index;

/** `spot_rewrite` : a-t-il choisi la bonne reformulation ? */
export const isRewriteCorrect = (entry: Pick<TrapEntry, "correct_rewrite_index">, picked: number): boolean =>
  entry.correct_rewrite_index !== null && picked === entry.correct_rewrite_index;

/** Réponse à mémoriser (sessionStorage) pour une prédiction. */
export function predictionToRecord(answer: PredictionAnswer): CycleAnswerRecord {
  if (answer.kind === "choice") return { picked: [answer.index] };
  if (answer.kind === "value") return answer.value === null ? { skipped: true } : { value: answer.value };
  return { skipped: true };
}

/** Réponse reconstruite depuis la valeur mémorisée (lecture tolérante : champ absent = « je ne sais pas »). */
export function recordToPrediction(record: CycleAnswerRecord): PredictionAnswer {
  if (record.picked && record.picked.length > 0) return { kind: "choice", index: record.picked[0] };
  if (typeof record.value === "number") return { kind: "value", value: record.value };
  return { kind: "skip" };
}

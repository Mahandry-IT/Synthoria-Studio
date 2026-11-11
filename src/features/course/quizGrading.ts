import type { QuizQuestion, QuizQuestionKind, QuizUserAnswer } from "./course.types";

/** Réussie si les indices choisis sont exactement les bonnes réponses (ordre et doublons ignorés). */
export function isAnswerCorrect(question: QuizQuestion, selected: number[]): boolean {
  const expected = [...question.correct_option_indices].sort();
  const given = [...new Set(selected)].sort();
  return expected.length > 0 && expected.length === given.length && expected.every((v, i) => v === given[i]);
}

export interface OptionFeedback {
  index: number;
  isCorrectOption: boolean;
  chosen: boolean;
  /** Retour propre à l'option (`explanation_per_choice`) ; vide si le backend n'en fournit pas. */
  text: string;
}

/**
 * Retour à afficher après validation : pour chaque option cochée ou correcte, son explication propre.
 * Les distracteurs non cochés ne sont pas commentés (on ne noie pas l'apprenant).
 */
export function optionFeedback(question: QuizQuestion, selected: number[]): OptionFeedback[] {
  const perChoice = question.explanation_per_choice ?? [];
  return question.options
    .map((_, index) => ({
      index,
      isCorrectOption: question.correct_option_indices.includes(index),
      chosen: selected.includes(index),
      text: perChoice[index] ?? "",
    }))
    .filter((f) => f.chosen || f.isCorrectOption);
}

/** Format d'une question ; les anciennes (champ absent) sont des choix. */
export function questionKind(question: Pick<QuizQuestion, "kind">): QuizQuestionKind {
  return question.kind ?? "choice";
}

/** Écart toléré pour une valeur attendue non entière (RG-2). */
export const NUMERIC_TOLERANCE = 0.0001;

/** Lit une saisie numérique (virgule française ou point, espaces ignorés) ; vide ou illisible → null. */
export function parseNumericInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * RG-2 : valeur attendue entière → égalité stricte ; sinon écart absolu <= 0,0001.
 * Une réponse vide ou non finie, ou une valeur attendue inconnue, est fausse.
 */
export function isNumericCorrect(expected: number | null | undefined, given: number | null | undefined): boolean {
  if (expected == null || given == null || !Number.isFinite(expected) || !Number.isFinite(given)) return false;
  if (Number.isInteger(expected)) return given === expected;
  // Tolérance légèrement élargie pour absorber l'erreur d'arrondi des flottants sur la borne
  return Math.abs(given - expected) <= NUMERIC_TOLERANCE + 1e-12;
}

/** Appariement : tout ou rien. Un sujet vide, ou un nombre de sujets différent, est faux. */
export function isMatchingCorrect(correctMatches: number[], given: (number | null)[]): boolean {
  return (
    correctMatches.length > 0 &&
    correctMatches.length === given.length &&
    correctMatches.every((expected, i) => given[i] === expected)
  );
}

export interface AvailableOption {
  index: number;
  label: string;
}

/**
 * Options proposées au sujet `subjectIndex` : toutes sauf celles déjà choisies pour un AUTRE sujet.
 * Sa propre sélection reste présente ; vider un sujet (null) remet son option à disposition (RG-3).
 */
export function availableOptions(
  options: string[],
  selections: (number | null)[],
  subjectIndex: number,
): AvailableOption[] {
  const taken = new Set(selections.filter((sel, i): sel is number => sel != null && i !== subjectIndex));
  return options.flatMap((label, index) => (taken.has(index) ? [] : [{ index, label }]));
}

/** Correction locale d'une question selon son format (`answer` absent = non répondue). */
export function isQuestionCorrect(question: QuizQuestion, answer: QuizUserAnswer | undefined): boolean {
  switch (questionKind(question)) {
    case "numeric":
      return isNumericCorrect(question.expected_value, answer?.numericValue);
    case "matching":
      return isMatchingCorrect(question.correct_matches ?? [], answer?.matches ?? []);
    default:
      return isAnswerCorrect(question, answer?.selectedOptionIndices ?? []);
  }
}

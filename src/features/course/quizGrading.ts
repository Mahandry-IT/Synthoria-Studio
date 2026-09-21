import type { QuizQuestion } from "./course.types";

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

import type { QuizAnswerInput, QuizQuestion, QuizUserAnswer } from "./course.types";
import { isQuestionCorrect, questionKind } from "./quizGrading";
import type { QuizAttemptSubmitResponse } from "./quizAttempt.schema";

/** Correction d'une question, quelle que soit sa source (serveur ou repli local). */
export interface QuizGradeItem {
  correct: boolean;
  pointsEarned: number;
}

/** Note d'une tentative terminée : `score / maxScore` (sur 20 pour une tentative enregistrée). */
export interface QuizGrade {
  score: number;
  maxScore: number;
  items: QuizGradeItem[];
  /** Questions du détail, complétées par les bonnes réponses et explications. */
  questions: QuizQuestion[];
}

/** Remplace (ou ajoute) la réponse de la question `questionIndex` (une liste d'indices vaut une réponse `choice`). */
export function upsertAnswer(
  answers: QuizUserAnswer[],
  questionIndex: number,
  input: number[] | QuizAnswerInput,
): QuizUserAnswer[] {
  const value: QuizAnswerInput = Array.isArray(input) ? { selectedOptionIndices: input } : input;
  const others = answers.filter((a) => a.questionIndex !== questionIndex);
  return [...others, { questionIndex, ...value }].sort((a, b) => a.questionIndex - b.questionIndex);
}

/** Une réponse au format de la soumission : indices, `[]`/`[valeur]`, ou un indice (ou null) par sujet. */
export type SubmittedAnswer = (number | null)[];

/** Réponses au format de la soumission, une entrée par question (vide si non répondue). */
export function toSubmittedAnswers(questions: QuizQuestion[], answers: QuizUserAnswer[]): SubmittedAnswer[] {
  return questions.map((question, i) => {
    const answer = answers.find((a) => a.questionIndex === i);
    switch (questionKind(question)) {
      case "numeric":
        return answer?.numericValue != null ? [answer.numericValue] : [];
      case "matching":
        return Array.from({ length: question.subjects?.length ?? 0 }, (_, s) => answer?.matches?.[s] ?? null);
      default:
        return [...new Set(answer?.selectedOptionIndices ?? [])];
    }
  });
}

/**
 * Repli hors tentative enregistrée (questions intégrées au cours) : note en points,
 * somme des points des questions justes sur le total des points.
 */
export function gradeLocally(questions: QuizQuestion[], answers: QuizUserAnswer[]): QuizGrade {
  const items = questions.map((question, i) => {
    const correct = isQuestionCorrect(question, answers.find((a) => a.questionIndex === i));
    return { correct, pointsEarned: correct ? question.points : 0 };
  });
  return {
    score: items.reduce((sum, item) => sum + item.pointsEarned, 0),
    maxScore: questions.reduce((sum, q) => sum + q.points, 0),
    items,
    questions,
  };
}

/** Note renvoyée par le serveur ; ses corrections complètent les questions tirées (sans bonnes réponses). */
export function gradeFromServer(questions: QuizQuestion[], response: QuizAttemptSubmitResponse): QuizGrade {
  const graded = questions.map((question, i) => {
    const result = response.results[i];
    if (!result) return question;
    return {
      ...question,
      correct_option_indices: result.correct_option_indices,
      kind: result.kind ?? question.kind,
      expected_value: result.expected_value ?? question.expected_value,
      unit: result.unit ?? question.unit,
      subjects: result.subjects?.length ? result.subjects : question.subjects,
      correct_matches: result.correct_matches?.length ? result.correct_matches : question.correct_matches,
      explanation: result.explanation || question.explanation,
      explanation_per_choice: result.explanation_per_choice.length
        ? result.explanation_per_choice
        : question.explanation_per_choice,
      points: result.points ?? question.points,
    };
  });
  const items = questions.map((_, i) => {
    const result = response.results[i];
    return {
      correct: result ? (result.is_correct ?? result.points_earned > 0) : false,
      pointsEarned: result?.points_earned ?? 0,
    };
  });
  return { score: response.score ?? 0, maxScore: response.max_score, items, questions: graded };
}

const scoreFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** Note lisible, ex. « 13,5 / 20 ». */
export function formatScore(score: number, maxScore: number): string {
  return `${scoreFormat.format(score)} / ${scoreFormat.format(maxScore)}`;
}

/** Appréciation selon la part des points obtenus. */
export function scoreAppreciation(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 1) return "Parfait ! 🎉";
  if (ratio >= 0.7) return "Bon résultat ! 👏";
  return "Continue à réviser 💪";
}

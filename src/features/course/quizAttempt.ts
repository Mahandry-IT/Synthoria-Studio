import type { QuizQuestion, QuizUserAnswer } from "./course.types";
import { isAnswerCorrect } from "./quizGrading";
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

/** Remplace (ou ajoute) la réponse de la question `questionIndex`. */
export function upsertAnswer(answers: QuizUserAnswer[], questionIndex: number, indices: number[]): QuizUserAnswer[] {
  const others = answers.filter((a) => a.questionIndex !== questionIndex);
  return [...others, { questionIndex, selectedOptionIndices: indices }].sort((a, b) => a.questionIndex - b.questionIndex);
}

function selectedFor(answers: QuizUserAnswer[], index: number): number[] {
  return answers.find((a) => a.questionIndex === index)?.selectedOptionIndices ?? [];
}

/** Réponses au format de la soumission : une liste d'indices sans doublon par question (vide si non répondue). */
export function toSubmittedAnswers(total: number, answers: QuizUserAnswer[]): number[][] {
  return Array.from({ length: total }, (_, i) => [...new Set(selectedFor(answers, i))]);
}

/**
 * Repli hors tentative enregistrée (questions intégrées au cours) : note en points,
 * somme des points des questions justes sur le total des points.
 */
export function gradeLocally(questions: QuizQuestion[], answers: QuizUserAnswer[]): QuizGrade {
  const items = questions.map((question, i) => {
    const correct = isAnswerCorrect(question, selectedFor(answers, i));
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

import { z } from "zod";
import { quizQuestionSchema } from "./course.schema";

/** Note maximale d'une tentative (les points sont recalculés côté serveur pour totaliser 20). */
export const QUIZ_MAX_SCORE = 20;
export const QUIZ_ABORT_REASON_MAX_LENGTH = 500;

/**
 * Réponse de `POST /courses/{sid}/quiz/attempts` : nouvelle série tirée de la banque.
 * Les bonnes réponses ne sont pas envoyées (`correct_option_indices` vaut alors `[]`).
 */
export const quizAttemptStartSchema = z.object({
  attempt_id: z.union([z.string().min(1), z.number()]).transform(String),
  questions: z.array(quizQuestionSchema).min(1),
});

/** Corps de `POST …/attempts/{aid}/submit` : indices choisis par question, dans l'ordre de la série. */
export const quizAttemptSubmitRequestSchema = z.object({
  answers: z.array(z.array(z.number().int().min(0))),
  aborted: z.boolean().optional(),
  abort_reason: z.string().max(QUIZ_ABORT_REASON_MAX_LENGTH).optional(),
});

/** Correction d'une question renvoyée par le serveur. */
export const quizAttemptResultSchema = z.object({
  correct_option_indices: z.array(z.number().int().min(0)),
  explanation: z.string().optional().default(""),
  explanation_per_choice: z.array(z.string()).optional().default([]),
  /** Points obtenus pour cette question (0 si fausse). */
  points_earned: z.number().min(0).default(0),
  /** Points possibles, si le serveur les renvoie. */
  points: z.number().min(0).optional(),
  is_correct: z.boolean().optional(),
});

/** Réponse de la soumission : note /20 calculée côté serveur (null pour une tentative interrompue). */
export const quizAttemptSubmitResponseSchema = z.object({
  score: z.number().min(0).nullable(),
  max_score: z.number().positive().default(QUIZ_MAX_SCORE),
  status: z.enum(["completed", "aborted"]),
  results: z.array(quizAttemptResultSchema).default([]),
});

export type QuizAttemptStart = z.infer<typeof quizAttemptStartSchema>;
export type QuizAttemptSubmitRequest = z.infer<typeof quizAttemptSubmitRequestSchema>;
export type QuizAttemptResult = z.infer<typeof quizAttemptResultSchema>;
export type QuizAttemptSubmitResponse = z.infer<typeof quizAttemptSubmitResponseSchema>;

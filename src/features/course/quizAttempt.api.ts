import { postJson } from "@/shared/api/httpClient";
import {
  quizAttemptStartSchema,
  quizAttemptSubmitRequestSchema,
  quizAttemptSubmitResponseSchema,
  type QuizAttemptStart,
  type QuizAttemptSubmitRequest,
  type QuizAttemptSubmitResponse,
} from "./quizAttempt.schema";

const attemptsPath = (sessionId: string) => `/courses/${encodeURIComponent(sessionId)}/quiz/attempts`;

/**
 * Démarre une tentative : le serveur tire une nouvelle série dans la banque du cours.
 * Sans retry : chaque appel crée une tentative.
 * @throws {HttpError} 404 session inconnue, 429 limiteur ; {Error} réponse invalide
 */
export async function startQuizAttempt(sessionId: string): Promise<QuizAttemptStart> {
  const raw = await postJson<unknown>(attemptsPath(sessionId), {}, { noRetry: true });
  const parsed = quizAttemptStartSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for quiz attempt start:", parsed.error);
    throw new Error("Réponse invalide du serveur pour le démarrage du quiz.");
  }
  return parsed.data;
}

/**
 * Soumet les réponses (ou l'interruption anti-triche) d'une tentative ; la correction est faite côté serveur.
 * @throws {HttpError} 404 tentative inconnue, 409 déjà soumise, 422 réponses invalides, 429 limiteur
 */
export async function submitQuizAttempt(
  sessionId: string,
  attemptId: string,
  payload: QuizAttemptSubmitRequest,
): Promise<QuizAttemptSubmitResponse> {
  const body = quizAttemptSubmitRequestSchema.parse(payload);
  const raw = await postJson<unknown>(
    `${attemptsPath(sessionId)}/${encodeURIComponent(attemptId)}/submit`,
    body,
    { noRetry: true },
  );
  const parsed = quizAttemptSubmitResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for quiz attempt submit:", parsed.error);
    throw new Error("Réponse invalide du serveur pour la correction du quiz.");
  }
  return parsed.data;
}

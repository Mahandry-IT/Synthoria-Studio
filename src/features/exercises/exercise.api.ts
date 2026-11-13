import { getJson, postJson } from "@/shared/api/httpClient";
import {
  exerciseAnswerRequestSchema,
  exerciseDetailSchema,
  exerciseEnqueueResponseSchema,
  exerciseFeedbackSchema,
  exerciseListSchema,
  uuidSchema,
} from "./exercise.schema";
import type { ExerciseDetail, ExerciseEnqueueResponse, ExerciseFeedback, ExerciseList } from "./exercise.types";

function assertUuid(value: string, what: string): string {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success) throw new Error(`Identifiant de ${what} invalide.`);
  return parsed.data;
}

function parseOrThrow<T>(
  schema: { safeParse: (raw: unknown) => { success: true; data: T } | { success: false; error: unknown } },
  raw: unknown,
  message: string,
): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`Zod validation failed (${message}):`, parsed.error);
    throw new Error(message);
  }
  return parsed.data;
}

/**
 * Lance la génération des exercices (202, asynchrone) ; l'avancement se suit avec `getExercises`.
 *
 * @throws {HttpError} 409 cours ou quiz pas encore prêt, 429 trop de demandes
 */
export async function generateExercises(sessionId: string): Promise<ExerciseEnqueueResponse> {
  const id = assertUuid(sessionId, "session");
  const raw = await postJson<unknown>(`/courses/${id}/exercises/generate`, undefined, { noRetry: true });
  return parseOrThrow(exerciseEnqueueResponseSchema, raw, "Réponse invalide du serveur pour les exercices.");
}

/** État de génération et liste des exercices (sans énoncé). */
export async function getExercises(sessionId: string): Promise<ExerciseList> {
  const raw = await getJson<unknown>(`/courses/${assertUuid(sessionId, "session")}/exercises`);
  return parseOrThrow(exerciseListSchema, raw, "Réponse invalide du serveur pour la liste des exercices.");
}

/** Détail d'un exercice (énoncé, indices), utilisé au lot 4. */
export async function getExercise(sessionId: string, exerciseId: string): Promise<ExerciseDetail> {
  const path = `/courses/${assertUuid(sessionId, "session")}/exercises/${assertUuid(exerciseId, "exercice")}`;
  return parseOrThrow(exerciseDetailSchema, await getJson<unknown>(path), "Réponse invalide du serveur pour l'exercice.");
}

/** Envoie la réponse de l'étudiant et renvoie la correction, utilisé au lot 4. */
export async function answerExercise(
  sessionId: string,
  exerciseId: string,
  answer: string,
): Promise<ExerciseFeedback> {
  const path = `/courses/${assertUuid(sessionId, "session")}/exercises/${assertUuid(exerciseId, "exercice")}/answer`;
  const parsedBody = exerciseAnswerRequestSchema.safeParse({ answer });
  if (!parsedBody.success) throw new Error("Saisissez une réponse avant de l'envoyer.");
  const body = parsedBody.data;
  const raw = await postJson<unknown>(path, body, { noRetry: true });
  return parseOrThrow(exerciseFeedbackSchema, raw, "Réponse invalide du serveur pour la correction.");
}

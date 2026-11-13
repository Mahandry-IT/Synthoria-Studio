import { z } from "zod";
import { courseContentBlockSchema } from "../course/course.schema";

export const uuidSchema = z.string().uuid();

/** Statut de génération ; un statut inconnu est traité comme un échec (le polling s'arrête). */
export const exerciseStatusSchema = z
  .enum(["absent", "pending", "generating", "done", "failed"])
  .catch("failed");

const nullableString = z.string().nullish().transform((v) => v ?? null);

/** Exercice de la liste : jamais d'énoncé (RG-8). */
export const exerciseSummarySchema = z.object({
  id: uuidSchema,
  section_id: nullableString,
  position: z.number().default(0),
  title: z.string().default(""),
  covers: z.string().default(""),
  /** Durée prévue : absente de la liste actuelle du serveur (le détail la fournit). */
  duration_minutes: z.number().nullish().transform((v) => v ?? null),
});

/** Réponse de GET /courses/{session_id}/exercises */
export const exerciseListSchema = z.object({
  status: exerciseStatusSchema,
  error_message: nullableString,
  exercises: z.array(exerciseSummarySchema).default([]),
});

/** Réponse (202) de POST /courses/{session_id}/exercises/generate */
export const exerciseEnqueueResponseSchema = z.object({
  status: exerciseStatusSchema,
});

/** Blocs de l'énoncé : tolérant, un bloc invalide est écarté sans invalider l'exercice. */
function parseStatementBlocks(raw: unknown): z.infer<typeof courseContentBlockSchema>[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = courseContentBlockSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Réponse de GET /courses/{session_id}/exercises/{id} (lot 4). */
export const exerciseDetailSchema = exerciseSummarySchema.extend({
  /** Énoncé : liste de blocs de contenu du cours (le backend renvoie `list[ContentBlock]`). */
  statement: z.unknown().optional().transform(parseStatementBlocks),
  hints: z.array(z.string()).default([]),
  duration_minutes: z.number().nullish().transform((v) => v ?? null),
});

/** Corps de POST .../{id}/answer (lot 4). */
export const exerciseAnswerRequestSchema = z.object({ answer: z.string().trim().min(1) }).strict();

/** Réponse de POST .../{id}/answer (lot 4). */
export const exerciseFeedbackSchema = z.object({
  feedback: z.string().default(""),
  correct_points: z.array(z.string()).default([]),
  missing_points: z.array(z.string()).default([]),
  expected_approach: z.string().default(""),
});

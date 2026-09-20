import { z } from "zod";

/** Identifiant de job / session : UUID validé avant de le glisser dans une URL. */
export const uuidSchema = z.string().uuid();

export const podcastStatusSchema = z.enum(["pending", "scripting", "synthesizing", "mixing", "done", "failed"]);

export const podcastJobSchema = z.object({
  job_id: uuidSchema,
  course_session_id: uuidSchema,
  status: podcastStatusSchema,
  stage: z.string().nullish().transform((v) => v ?? null),
  progress: z.number().min(0).max(100).default(0),
  error_message: z.string().nullish().transform((v) => v ?? null),
  duration_seconds: z.number().nullish().transform((v) => v ?? null),
  created_at: z.string(),
  updated_at: z.string(),
});

export const podcastSummarySchema = podcastJobSchema.extend({
  title: z.string().default(""),
});

/** Réponse de GET /podcasts */
export const podcastSummaryListSchema = z.object({ data: z.array(podcastSummarySchema) });

/** Réponse de GET /courses/history/{session_id}/podcasts */
export const podcastJobListSchema = z.object({ data: z.array(podcastJobSchema) });

/** Réponse de POST /podcasts/generate/{session_id} */
export const podcastEnqueueResponseSchema = z.object({
  job_id: uuidSchema,
  status: podcastStatusSchema,
});

/** Options d'un enqueue (mêmes bornes que le backend : 3 à 60 minutes, styles connus). */
export const podcastGenerationOptionsSchema = z
  .object({
    style: z.enum(["conversational", "educational", "concise"]).optional(),
    target_minutes: z.number().int().min(3).max(60).optional(),
    force: z.boolean().optional(),
  })
  .strict();

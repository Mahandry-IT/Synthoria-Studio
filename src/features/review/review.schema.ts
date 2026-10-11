import { z } from "zod";

export const reviewCardModeSchema = z.enum(["qcm", "text"]);

/**
 * Carte à réviser (GET /reviews/due) : `due_at` nul = carte jamais révisée.
 * `variant_no` avance à chaque « je savais » (variante générée sur la même notion) ; `mode` alterne
 * QCM et réponse libre. Champs optionnels : compatibilité avec un backend antérieur aux variantes.
 */
export const dueCardSchema = z.object({
  session_id: z.string().uuid(),
  course_title: z.string().optional().default(""),
  card_id: z.string().min(1),
  front: z.string(),
  back: z.string(),
  box: z.number().int().min(0).default(0),
  due_at: z.string().nullish(),
  variant_no: z.number().int().min(0).default(0),
  mode: reviewCardModeSchema.optional(),
  choices: z.array(z.string()).nullish().transform((v) => v ?? []),
  correct_indices: z.array(z.number().int().min(0)).nullish().transform((v) => v ?? []),
  explanation: z.string().nullish().transform((v) => v ?? ""),
});

export const dueCardListSchema = z.object({
  cards: z.array(dueCardSchema),
  total_due: z.number().int().min(0),
});

export const reviewResultSchema = z.enum(["correct", "incorrect"]);

/** Réponse de POST /reviews/{session_id}/{card_id} */
export const reviewResponseSchema = z.object({
  box: z.number().int().min(0),
  due_at: z.string(),
});

export type DueCard = z.infer<typeof dueCardSchema>;
export type ReviewCardMode = z.infer<typeof reviewCardModeSchema>;
export type DueCardList = z.infer<typeof dueCardListSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

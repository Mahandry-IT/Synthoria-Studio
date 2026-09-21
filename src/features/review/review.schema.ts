import { z } from "zod";

/** Carte à réviser (GET /reviews/due) : `due_at` nul = carte jamais révisée. */
export const dueCardSchema = z.object({
  session_id: z.string().uuid(),
  course_title: z.string().optional().default(""),
  card_id: z.string().min(1),
  front: z.string(),
  back: z.string(),
  box: z.number().int().min(0).default(0),
  due_at: z.string().nullish(),
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
export type DueCardList = z.infer<typeof dueCardListSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

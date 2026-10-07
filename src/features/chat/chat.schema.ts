import { z } from "zod";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/shared/utils/constants";

/** Corps de POST /courses/{session_id}/chat : le message seul, la session vient de l'URL. */
export const chatRequestSchema = z.object({
  /** Section en cours de lecture (facultatif) : le serveur la prend en priorité comme contexte. */
  section_id: z.string().min(1).max(64).optional(),
  /**
   * Message du tuteur après lequel s'insère la question (`null` : racine de la conversation).
   * Éditer une question = renvoyer le `parent_id` de la question éditée (nouvelle version sœur).
   */
  parent_id: z.string().min(1).nullable().optional(),
  message: z
    .string()
    .trim()
    .min(1, "Écrivez votre question avant de l'envoyer.")
    .max(
      CHAT_MESSAGE_MAX_LENGTH,
      `Votre message ne peut pas dépasser ${CHAT_MESSAGE_MAX_LENGTH} caractères.`,
    ),
});

export const chatSourceSchema = z.object({
  label: z.string(),
  reference: z.string(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  /** `off_topic` : la question ne porte pas sur le cours (réponse de refus fixe). */
  status: z.enum(["answered", "off_topic"]),
  sources: z.array(chatSourceSchema).optional().default([]),
  created_at: z.string(),
  /**
   * Parent dans l'arbre de la conversation : réponse précédente pour une question (`null` = racine),
   * question pour une réponse. Les questions de même parent sont des versions sœurs.
   * Défaut `null` pour les historiques antérieurs aux versions.
   */
  parent_id: z.string().nullable().optional().default(null),
});

/** Quota quotidien de messages du cours (remis à zéro à `resets_at`, minuit UTC). */
export const chatQuotaSchema = z.object({
  limit: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  resets_at: z.string(),
});

/** Réponse de GET /courses/{session_id}/chat (messages en ordre chronologique croissant). */
export const chatHistoryResponseSchema = z.object({
  messages: z.array(chatMessageSchema),
  quota: chatQuotaSchema,
});

/** Réponse de POST /courses/{session_id}/chat : l'échange enregistré et le quota à jour. */
export const chatSendResponseSchema = z.object({
  user_message: chatMessageSchema,
  assistant_message: chatMessageSchema,
  quota: chatQuotaSchema,
});

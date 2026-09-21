import { getJson, postJson } from "@/shared/api/httpClient";
import {
  dueCardListSchema,
  reviewResponseSchema,
  reviewResultSchema,
  type DueCardList,
  type ReviewResponse,
  type ReviewResult,
} from "./review.schema";
import { z } from "zod";

/** Cartes par session de révision (le backend accepte 1 à 100). */
export const REVIEW_SESSION_SIZE = 20;

const uuid = z.string().uuid();
/** `card_id` = « <id de section>-<n° de question> » : jamais de chaîne libre dans une URL. */
const cardId = z.string().regex(/^[A-Za-z0-9#_-]{1,64}$/);

/**
 * Cartes à réviser aujourd'hui (jamais révisées ou échues), les plus en retard d'abord.
 *
 * @throws {HttpError} en cas d'erreur HTTP
 * @throws {Error} si la réponse ne correspond pas au schéma attendu
 */
export async function getDueCards(limit: number = REVIEW_SESSION_SIZE): Promise<DueCardList> {
  const raw = await getJson<unknown>(`/reviews/due?limit=${encodeURIComponent(String(limit))}`);
  const parsed = dueCardListSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for due cards:", parsed.error);
    throw new Error("Réponse invalide du serveur pour les cartes à réviser.");
  }
  return parsed.data;
}

/**
 * Enregistre le résultat d'une carte : le serveur planifie la prochaine révision (Leitner).
 *
 * @throws {Error} si les identifiants ou le résultat sont invalides, ou la réponse inattendue
 * @throws {HttpError} 404 carte inconnue, 429 trop de révisions
 */
export async function recordReview(
  sessionId: string,
  card: string,
  result: ReviewResult,
): Promise<ReviewResponse> {
  const session = uuid.safeParse(sessionId);
  const cardParsed = cardId.safeParse(card);
  const resultParsed = reviewResultSchema.safeParse(result);
  if (!session.success || !cardParsed.success || !resultParsed.success) {
    throw new Error("Carte de révision invalide.");
  }

  const raw = await postJson<unknown>(
    `/reviews/${session.data}/${encodeURIComponent(cardParsed.data)}`,
    { result: resultParsed.data },
    { noRetry: true },
  );
  const parsed = reviewResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for review:", parsed.error);
    throw new Error("Réponse invalide du serveur pour la révision.");
  }
  return parsed.data;
}

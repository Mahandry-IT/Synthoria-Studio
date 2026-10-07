import { deleteJson, getJson, postJson } from "@/shared/api/httpClient";
import { chatHistoryResponseSchema, chatRequestSchema, chatSendResponseSchema } from "./chat.schema";
import type { ChatHistoryResponse, ChatSendResponse } from "./chat.types";

/** Une réponse du tuteur : un appel Gemini, parfois avec recherche web. */
const CHAT_TIMEOUT_MS = 60_000;

function chatPath(sessionId: string): string {
  return `/courses/${encodeURIComponent(sessionId)}/chat`;
}

/**
 * Historique du chat d'un cours (ordre chronologique) et quota du jour.
 *
 * @throws {Error} si la réponse du serveur est invalide
 * @throws {HttpError} 404 cours inconnu
 */
export async function getChat(sessionId: string): Promise<ChatHistoryResponse> {
  const raw = await getJson<unknown>(chatPath(sessionId));

  const parsed = chatHistoryResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for chat history:", parsed.error);
    throw new Error("Réponse invalide du serveur pour le chat.");
  }
  return parsed.data;
}

export interface SendChatOptions {
  /** Section en cours de lecture : contexte prioritaire côté serveur. */
  sectionId?: string;
  /**
   * Réponse du tuteur après laquelle s'insère la question (`null` : racine). Pour éditer une
   * question, le parent de la question éditée : le serveur crée une version sœur.
   */
  parentId?: string | null;
}

/**
 * Envoie une question (ou une nouvelle version d'une question) au tuteur du cours. Le cours est lu
 * côté serveur. Sans retry : un message rejoué consommerait le quota une seconde fois.
 *
 * @throws {Error} si le message est vide ou trop long, ou si la réponse du serveur est invalide
 * @throws {HttpError} 404, 422, 429 (limite par minute ou par jour), 502, 503
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
  { sectionId, parentId }: SendChatOptions = {},
): Promise<ChatSendResponse> {
  const request = chatRequestSchema.safeParse({ message, section_id: sectionId, parent_id: parentId });
  if (!request.success) throw new Error(request.error.issues[0]?.message ?? "Message invalide.");

  const raw = await postJson<unknown>(chatPath(sessionId), request.data, {
    timeout: CHAT_TIMEOUT_MS,
    noRetry: true,
  });

  const parsed = chatSendResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Zod validation failed for chat message:", parsed.error);
    throw new Error("Réponse invalide du moteur IA pour le chat. Réessayez.");
  }
  return parsed.data;
}

/**
 * Supprime une question, sa réponse et toute leur descendance (le quota n'est pas rendu).
 *
 * @throws {HttpError} 404 cours ou message inconnu
 */
export async function deleteChatMessage(sessionId: string, messageId: string): Promise<void> {
  await deleteJson(`${chatPath(sessionId)}/messages/${encodeURIComponent(messageId)}`);
}

/**
 * Supprime tout le chat du cours (le quota n'est pas rendu).
 *
 * @throws {HttpError} 404 cours inconnu
 */
export async function clearChat(sessionId: string): Promise<void> {
  await deleteJson(chatPath(sessionId));
}

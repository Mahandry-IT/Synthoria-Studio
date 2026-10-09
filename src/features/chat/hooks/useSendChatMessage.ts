"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastError } from "@/shared/ui/toast";
import { sendChatMessage } from "../chat.api";
import { appendExchange } from "../chat.logic";
import type { ChatHistoryResponse } from "../chat.types";
import { courseChatKey, courseChatMutationKey } from "./useCourseChat";

/** Sans `detail` du backend, un 429 vise la limite du chat et non le quota Gemini générique. */
const CHAT_ERROR_MESSAGES = { 429: "Limite de messages atteinte pour ce cours. Réessayez plus tard." } as const;

export interface SendChatVariables {
  message: string;
  /** Section en cours de lecture, si connue : contexte prioritaire côté serveur. */
  sectionId?: string;
  /** Réponse après laquelle s'insère la question (`null` : racine). */
  parentId: string | null;
  /** Question éditée (affichage seulement) : le fil est coupé à cette question pendant l'envoi. */
  editedId?: string;
}

/**
 * Envoie une question au chat du cours, ou une nouvelle version d'une question éditée. En cas de succès, l'échange et le quota sont reportés
 * dans le cache ; l'historique est ensuite resynchronisé (aussi après un 429, pour le quota).
 */
export function useSendChatMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const key = courseChatKey(sessionId);

  return useMutation({
    mutationKey: [...courseChatMutationKey(sessionId), "send"],
    mutationFn: ({ message, sectionId, parentId }: SendChatVariables) =>
      sendChatMessage(sessionId, message, { sectionId, parentId }),
    onSuccess: (exchange) => {
      queryClient.setQueryData<ChatHistoryResponse>(key, (current) => appendExchange(current, exchange));
    },
    onError: (err) => toastError(err, { messages: CHAT_ERROR_MESSAGES }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { deleteChatMessage } from "../chat.api";
import { removeMessageBranch } from "../chat.logic";
import type { ChatHistoryResponse } from "../chat.types";
import { courseChatKey, courseChatMutationKey } from "./useCourseChat";

/**
 * Supprime une question, sa réponse et leur descendance : retirées du cache dès le succès,
 * puis l'historique est resynchronisé.
 */
export function useDeleteChatMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const key = courseChatKey(sessionId);

  return useMutation({
    mutationKey: [...courseChatMutationKey(sessionId), "delete"],
    mutationFn: (messageId: string) => deleteChatMessage(sessionId, messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData<ChatHistoryResponse>(key, (current) =>
        current ? removeMessageBranch(current, messageId) : current,
      );
      toastSuccess("Question supprimée.");
    },
    onError: (err) => toastError(err),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

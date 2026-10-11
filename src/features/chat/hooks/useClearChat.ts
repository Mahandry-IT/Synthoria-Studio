"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { clearChat } from "../chat.api";
import type { ChatHistoryResponse } from "../chat.types";
import { courseChatKey, courseChatMutationKey } from "./useCourseChat";

/** Supprime tout le chat du cours (le quota du jour est conservé), puis resynchronise l'historique. */
export function useClearChat(sessionId: string) {
  const queryClient = useQueryClient();
  const key = courseChatKey(sessionId);

  return useMutation({
    mutationKey: [...courseChatMutationKey(sessionId), "clear"],
    mutationFn: () => clearChat(sessionId),
    onSuccess: () => {
      queryClient.setQueryData<ChatHistoryResponse>(key, (current) =>
        current ? { ...current, messages: [] } : current,
      );
      toastSuccess("Conversation supprimée.");
    },
    onError: (err) => toastError(err),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

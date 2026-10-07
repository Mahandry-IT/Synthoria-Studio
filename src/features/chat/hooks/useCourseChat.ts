"use client";

import { useQuery } from "@tanstack/react-query";
import { getChat } from "../chat.api";

/** Clé React Query de l'historique du chat d'un cours. */
export const courseChatKey = (sessionId: string) => ["course-chat", sessionId] as const;

/** Préfixe des clés de mutation du chat d'un cours (envoi, suppression) : sert à savoir si une est en cours. */
export const courseChatMutationKey = (sessionId: string) => ["course-chat-mutation", sessionId] as const;

/** Historique du chat d'un cours et quota du jour ; inactif tant qu'aucun cours n'est choisi. */
export function useCourseChat(sessionId: string | null) {
  return useQuery({
    queryKey: courseChatKey(sessionId ?? ""),
    queryFn: () => getChat(sessionId as string),
    enabled: Boolean(sessionId),
    staleTime: 30_000,
  });
}

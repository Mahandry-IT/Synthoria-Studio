"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueuePodcast } from "../podcast.api";
import type { PodcastEnqueueResponse, PodcastGenerationOptions } from "../podcast.types";
import { resolveErrorMessage } from "@/shared/api/errors";
import { toastWarning } from "@/shared/ui/toast";

interface EnqueueVariables {
  sessionId: string;
  options?: PodcastGenerationOptions;
}

/**
 * Met un podcast en file pour une session de cours. Un échec n'est qu'un avertissement :
 * le cours déjà affiché n'est jamais remis en cause. `isPending` sert de garde anti double-clic
 * (le backend est aussi idempotent : un job équivalent non échoué est renvoyé tel quel).
 */
export function useEnqueuePodcast(onEnqueued?: (response: PodcastEnqueueResponse) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, options }: EnqueueVariables) => enqueuePodcast(sessionId, options),
    onSuccess: (response, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["session-podcasts", sessionId] });
      onEnqueued?.(response);
    },
    onError: (err) =>
      toastWarning(`Le podcast n'a pas pu être lancé : ${resolveErrorMessage(err)} Le cours reste disponible.`),
  });
}

"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toastError } from "@/shared/ui/toast";
import { getDueCards, recordReview, REVIEW_SESSION_SIZE } from "../review.api";
import type { ReviewResult } from "../review.schema";

export const DUE_CARDS_KEY = "due-cards";

/** Cartes à réviser aujourd'hui (le compteur `total_due` alimente la carte du dashboard). */
export function useDueCards(limit: number = REVIEW_SESSION_SIZE) {
  return useQuery({
    queryKey: [DUE_CARDS_KEY, limit],
    queryFn: () => getDueCards(limit),
  });
}

/** Enregistre le résultat d'une carte ; la liste est rafraîchie par `ReviewSession` à la fin de la session. */
export function useRecordReview() {
  return useMutation({
    mutationFn: ({ sessionId, cardId, result }: { sessionId: string; cardId: string; result: ReviewResult }) =>
      recordReview(sessionId, cardId, result),
    onError: toastError,
  });
}

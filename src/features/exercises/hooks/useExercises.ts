"use client";

import { useQuery } from "@tanstack/react-query";
import { getExercises } from "../exercise.api";
import { exercisesPollIntervalMs } from "../exercise.state";

export const exercisesQueryKey = (sessionId: string | null) => ["course-exercises", sessionId] as const;

/**
 * Suit l'état et la liste des exercices d'un cours. Un seul observateur doit activer `poll` (le cours) :
 * il relève tant que la génération est en cours, jusqu'à 3 échecs de lecture ; les autres lisent le cache partagé.
 */
export function useExercises(sessionId: string | null, { poll = false }: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: exercisesQueryKey(sessionId),
    enabled: sessionId !== null,
    staleTime: 0,
    queryFn: () => getExercises(sessionId as string),
    refetchInterval: poll ? (q) => exercisesPollIntervalMs(q.state.data?.status, q.state.errorUpdateCount) : false,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getExercises } from "../exercise.api";
import { exercisesPollIntervalMs } from "../exercise.state";

export const exercisesQueryKey = (sessionId: string | null) => ["course-exercises", sessionId] as const;

/** Suit l'état et la liste des exercices d'un cours ; polling tant que la génération est en cours, arrêté après 3 échecs de lecture. */
export function useExercises(sessionId: string | null) {
  return useQuery({
    queryKey: exercisesQueryKey(sessionId),
    enabled: sessionId !== null,
    staleTime: 0,
    queryFn: () => getExercises(sessionId as string),
    refetchInterval: (q) => exercisesPollIntervalMs(q.state.data?.status, q.state.errorUpdateCount),
  });
}

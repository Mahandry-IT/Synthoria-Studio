"use client";

import { useQuery } from "@tanstack/react-query";
import { getExercise } from "../exercise.api";
import { isDetailFetchEnabled } from "../exerciseSession";

export const exerciseDetailQueryKey = (sessionId: string, exerciseId: string) =>
  ["course-exercise", sessionId, exerciseId] as const;

/**
 * Détail d'un exercice (énoncé, indices). la requête reste désactivée tant que « Commencer » n'est pas
 * cliqué (`started`) : l'énoncé n'est ni demandé ni présent dans le DOM avant (RG-8). Un 404 n'est pas rejoué.
 */
export function useExerciseDetail(sessionId: string, exerciseId: string, started: boolean) {
  return useQuery({
    queryKey: exerciseDetailQueryKey(sessionId, exerciseId),
    enabled: isDetailFetchEnabled(started, sessionId, exerciseId),
    staleTime: 0,
    // Pas d'éjection (404) ni de rechargement de l'énoncé en pleine saisie au retour de fenêtre ou de réseau.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
    retry: false,
    queryFn: () => getExercise(sessionId, exerciseId),
  });
}

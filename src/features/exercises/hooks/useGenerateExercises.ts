"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateExercises } from "../exercise.api";
import { exercisesLaunchErrorMessage } from "../exercise.state";
import { exercisesQueryKey } from "./useExercises";
import { toastWarning } from "@/shared/ui/toast";

/** Lance la génération des exercices ; `isPending` fait office de garde anti double-clic. */
export function useGenerateExercises(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => generateExercises(sessionId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exercisesQueryKey(sessionId) }),
    onError: (err) =>
      toastWarning(`Les exercices n'ont pas pu être lancés : ${exercisesLaunchErrorMessage(err)}`),
  });
}

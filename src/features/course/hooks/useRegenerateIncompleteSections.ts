"use client";

import { useMutation } from "@tanstack/react-query";
import { regenerateIncompleteSections } from "../course.api";
import type { RegenerateIncompleteSectionsResponse } from "../course.types";
import { describeRegeneration } from "../incompleteCourse";
import { toastError, toastSuccess, toastWarning } from "@/shared/ui/toast";

/**
 * Régénère toutes les sections incomplètes d'un cours en un appel. Un résultat partiel (quota
 * atteint, plafond par appel, section encore invalide) est un succès HTTP : les sections réussies
 * sont transmises à `onRegenerated`, et un toast dit ce qui reste et pourquoi.
 * L'erreur (409, 429, 502/503…) est signalée par un toast avec « Réessayer ».
 */
export function useRegenerateIncompleteSections(onRegenerated: (result: RegenerateIncompleteSectionsResponse) => void) {
  const mutation = useMutation({
    mutationFn: (sessionId: string) => regenerateIncompleteSections(sessionId),
    onSuccess: (result) => {
      onRegenerated(result);
      const outcome = describeRegeneration(result);
      if (outcome.kind === "success") toastSuccess(outcome.message);
      else toastWarning(outcome.message);
    },
    onError: (err, sessionId) => toastError(err, { onRetry: () => mutation.mutate(sessionId) }),
  });
  return mutation;
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getPendingPlan } from "@/features/course/course.api";
import { storePendingPlan, toPendingPlan } from "@/features/course/askFlow";
import { toastError } from "@/shared/ui/toast";

/**
 * « Reprendre » un plan en cours : relit le plan côté backend, le dépose dans le sessionStorage
 * de /ask puis ouvre /ask, qui affiche directement la revue du plan. Sur erreur (plan expiré ou
 * supprimé), la liste est rafraîchie pour ne plus proposer ce plan.
 */
export function useResumePlan() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const pending = toPendingPlan(await getPendingPlan(planId));
      if (!storePendingPlan(pending)) {
        throw new Error("Impossible de reprendre le plan : le stockage du navigateur est indisponible.");
      }
    },
    onSuccess: () => router.push("/ask"),
    onError: (err) => {
      toastError(err);
      queryClient.invalidateQueries({ queryKey: ["pending-plans"] });
    },
  });
}

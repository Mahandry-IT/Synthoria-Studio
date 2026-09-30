"use client";

import { useRouter } from "next/navigation";
import { storePendingPlanId } from "@/features/course/askFlow";
import { toastError } from "@/shared/ui/toast";

/**
 * « Reprendre » un plan en cours : mémorise son id dans le sessionStorage de /ask puis ouvre /ask,
 * qui relit le plan côté backend et affiche directement sa revue.
 */
export function useResumePlan() {
  const router = useRouter();

  return {
    resume: (planId: string) => {
      if (!storePendingPlanId(planId)) {
        toastError(new Error("Impossible de reprendre le plan : le stockage du navigateur est indisponible."));
        return;
      }
      router.push("/ask");
    },
  };
}

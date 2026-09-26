"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlan } from "@/features/course/course.api";
import { toastError, toastSuccess } from "@/shared/ui/toast";

/** Supprime un plan proposé (dashboard) ; rafraîchit la liste des plans en cours. */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => deletePlan(planId),
    onSuccess: () => {
      toastSuccess("Plan supprimé.");
      queryClient.invalidateQueries({ queryKey: ["pending-plans"] });
    },
    onError: toastError,
  });
}

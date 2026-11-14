"use client";

import { useMemo } from "react";
import { usePendingPlans } from "@/features/dashboard/hooks/usePendingPlans";
import { useCourseHistory } from "@/features/history/hooks/useCourseHistory";
import { useFiles } from "@/features/ingestion/hooks/useFiles";
import { useDueCards } from "@/features/review/hooks/useReview";
import { REVIEW_SESSION_SIZE } from "@/features/review/review.api";
import { useNow } from "@/shared/hooks/useNow";
import { buildNavCounts, type NavCounts } from "./navCounts";

/**
 * Compteurs de la navigation. Réutilise les hooks existants (clés de cache partagées avec le tableau
 * de bord) : pas de nouvel endpoint. Une requête en échec ou en cours n'affiche rien plutôt qu'un 0.
 * Les plans comptés sont ceux de la première page du tableau de bord (5), hors plans expirés.
 */
export function useNavCounts(): NavCounts {
  const files = useFiles(1, 1);
  const history = useCourseHistory(1, 1);
  const due = useDueCards(REVIEW_SESSION_SIZE);
  const plans = usePendingPlans();

  const now = useNow(30_000);

  const filesTotal = files.data?.meta.total;
  const coursesTotal = history.data?.meta.total;
  const totalDue = due.data?.total_due;
  const planItems = plans.data?.data;

  return useMemo(
    () => buildNavCounts({ filesTotal, coursesTotal, totalDue, plans: planItems, now }),
    [filesTotal, coursesTotal, totalDue, planItems, now],
  );
}

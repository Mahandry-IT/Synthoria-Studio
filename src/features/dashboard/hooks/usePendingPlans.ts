"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPendingPlans } from "@/features/course/course.api";

/** Plans en cours (proposés, non expirés, pas encore transformés en cours), paginés. */
export function usePendingPlans(page: number = 1, limit: number = 5) {
  return useQuery({
    queryKey: ["pending-plans", page, limit],
    queryFn: () => listPendingPlans(page, limit),
    placeholderData: keepPreviousData,
  });
}

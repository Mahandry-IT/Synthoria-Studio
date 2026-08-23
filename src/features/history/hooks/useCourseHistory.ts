"use client";

import { useQuery } from "@tanstack/react-query";
import { getCourseHistory } from "../history.api";

interface UseCourseHistoryReturn {
  data: Awaited<ReturnType<typeof getCourseHistory>> | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Query React Query pour la liste paginée de l'historique des cours.
 */
export function useCourseHistory(
  page: number = 1,
  limit: number = 10,
): UseCourseHistoryReturn {
  const query = useQuery({
    queryKey: ["course-history", page, limit],
    queryFn: () => getCourseHistory(page, limit),
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getCourseHistoryById } from "../history.api";

interface UseCourseHistoryDetailReturn {
  data: Awaited<ReturnType<typeof getCourseHistoryById>> | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Query React Query pour le détail d'un cours historique.
 */
export function useCourseHistoryDetail(
  id: string,
): UseCourseHistoryDetailReturn {
  const query = useQuery({
    queryKey: ["course-history", id],
    queryFn: () => getCourseHistoryById(id),
    enabled: !!id,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

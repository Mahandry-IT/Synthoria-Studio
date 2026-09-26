"use client";

import { useQuery } from "@tanstack/react-query";
import { getCourseHistory } from "../history.api";
import type { CourseFolderFilter } from "../history.types";

interface UseCourseHistoryReturn {
  data: Awaited<ReturnType<typeof getCourseHistory>> | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Query React Query pour la liste paginée de l'historique des cours, filtrable par dossier.
 */
export function useCourseHistory(
  page: number = 1,
  limit: number = 10,
  filter?: CourseFolderFilter,
): UseCourseHistoryReturn {
  const query = useQuery({
    queryKey: ["course-history", page, limit, filter?.folder ?? null, filter?.subfolder ?? null],
    queryFn: () => getCourseHistory(page, limit, filter),
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

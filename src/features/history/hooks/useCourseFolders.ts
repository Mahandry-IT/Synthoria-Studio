"use client";

import { useQuery } from "@tanstack/react-query";
import { getCourseFolders } from "../history.api";
import type { CourseFolder } from "../history.types";

interface UseCourseFoldersReturn {
  data: CourseFolder[];
  isLoading: boolean;
  error: Error | null;
}

/** Query React Query pour l'arborescence des dossiers/sous-dossiers de cours. */
export function useCourseFolders(): UseCourseFoldersReturn {
  const query = useQuery({
    queryKey: ["course-folders"],
    queryFn: getCourseFolders,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

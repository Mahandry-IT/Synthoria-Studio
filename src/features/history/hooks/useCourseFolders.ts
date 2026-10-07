"use client";

import { useQuery } from "@tanstack/react-query";
import { getCourseFolders } from "../history.api";
import type { CourseFolder } from "../history.types";
import type { FolderSummary } from "@/components/folders/folders.types";

interface UseCourseFoldersReturn {
  data: FolderSummary[];
  isLoading: boolean;
  error: Error | null;
}

/** Ramène l'arborescence renvoyée par l'API à la forme générique des composants de dossiers. */
function toFolderSummaries(folders: CourseFolder[]): FolderSummary[] {
  return folders.map((f) => ({
    name: f.name,
    count: f.course_count,
    subfolders: f.subfolders.map((s) => ({ name: s.name, count: s.course_count })),
  }));
}

/** Query React Query pour l'arborescence des dossiers/sous-dossiers de cours. */
export function useCourseFolders(): UseCourseFoldersReturn {
  const query = useQuery({
    queryKey: ["course-folders"],
    queryFn: getCourseFolders,
    select: toFolderSummaries,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

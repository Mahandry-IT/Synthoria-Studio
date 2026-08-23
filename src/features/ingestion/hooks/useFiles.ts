"use client";

import { useQuery } from "@tanstack/react-query";
import { listFiles } from "../ingestion.api";
import type { FileListResponse } from "../ingestion.types";

interface UseFilesReturn {
  data: FileListResponse | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Query React Query pour récupérer la liste paginée des fichiers PDF ingestés.
 * Utilisé pour peupler le sélecteur de fichiers du Mode 2.
 */
export function useFiles(
  page: number = 1,
  limit: number = 10,
): UseFilesReturn {
  const query = useQuery({
    queryKey: ["files", page, limit],
    queryFn: () => listFiles(page, limit),
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

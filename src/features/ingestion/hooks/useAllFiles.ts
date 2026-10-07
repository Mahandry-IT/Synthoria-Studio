"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { listFiles } from "../ingestion.api";
import type { FileInfo } from "../ingestion.types";

const PAGE_LIMIT = 100;

interface UseAllFilesReturn {
  data: FileInfo[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Récupère la liste complète de tous les fichiers ingestés en paginant
 * automatiquement les pages du backend (max 100/page).
 * Les résultats sont mis en cache par React Query (staleTime 30s).
 */
export function useAllFiles(): UseAllFilesReturn {
  const query = useInfiniteQuery({
    queryKey: ["allFiles"],
    queryFn: ({ pageParam }) => listFiles(pageParam, PAGE_LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    staleTime: 30_000,
  });

  // Déclenche le fetch des pages restantes dès que la première arrive
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Référence stable entre les rendus : les listes et l'arbre de dossiers dérivés sont mémoïsés dessus
  const pages = query.data?.pages;
  const data = useMemo(() => pages?.flatMap((p) => p.data) ?? [], [pages]);

  return {
    data,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

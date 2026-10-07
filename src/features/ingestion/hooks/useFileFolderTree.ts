"use client";

import { useMemo } from "react";
import { useAllFiles } from "./useAllFiles";
import { buildFolderTree } from "../fileFolders";
import type { FolderSummary } from "@/components/folders/folders.types";

/**
 * Arborescence des dossiers de fichiers et compteurs, calculés côté client depuis la liste
 * complète (`useAllFiles`, déjà en cache) : pas d'appel API dédié.
 */
export function useFileFolderTree(): { folders: FolderSummary[]; isLoading: boolean } {
  const { data: files, isLoading } = useAllFiles();
  const folders = useMemo(() => buildFolderTree(files), [files]);
  return { folders, isLoading };
}

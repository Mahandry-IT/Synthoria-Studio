"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Rafraîchit les deux listes de fichiers (page d'upload et sélecteur de /ask). */
export function useInvalidateFiles(): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["files"] });
    queryClient.invalidateQueries({ queryKey: ["allFiles"] });
  }, [queryClient]);
}

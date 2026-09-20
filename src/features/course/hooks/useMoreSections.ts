"use client";

import { useMutation } from "@tanstack/react-query";
import { generateMoreSections } from "../course.api";
import { toastError } from "@/shared/ui/toast";

/** Génération IA de nouvelles sections de développement à partir de « Pour aller plus loin ». */
export function useMoreSections() {
  return useMutation({
    mutationFn: generateMoreSections,
    onError: toastError,
  });
}

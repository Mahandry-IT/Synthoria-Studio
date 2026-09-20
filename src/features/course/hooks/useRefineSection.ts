"use client";

import { useMutation } from "@tanstack/react-query";
import { refinePlanSection } from "../course.api";
import { toastError } from "@/shared/ui/toast";

/** Complétion IA d'une section du plan (ajoute ce qui manque, avec ou sans précisions de l'utilisateur). */
export function useRefineSection() {
  return useMutation({
    mutationFn: refinePlanSection,
    onError: toastError,
  });
}

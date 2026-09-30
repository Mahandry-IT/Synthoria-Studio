"use client";

import { useMutation } from "@tanstack/react-query";
import { addCourseSections } from "../course.api";
import { toastError } from "@/shared/ui/toast";

interface AddCourseSectionsVariables {
  sessionId: string;
  instructions: string;
}

/** Ajoute du contenu à un cours déjà généré ; l'erreur (429, 502/503…) est signalée par un toast. */
export function useAddCourseSections() {
  return useMutation({
    mutationFn: ({ sessionId, instructions }: AddCourseSectionsVariables) =>
      addCourseSections(sessionId, instructions),
    onError: toastError,
  });
}

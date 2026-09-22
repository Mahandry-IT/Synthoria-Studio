"use client";

import { useMutation } from "@tanstack/react-query";
import { saveSectionNote } from "../course.api";
import { toastError } from "@/shared/ui/toast";

interface SaveNoteVariables {
  sessionId: string;
  sectionId: string;
  note: string;
}

/** Enregistre la note libre d'une section ; l'erreur (429…) est signalée par un toast. */
export function useSaveSectionNote() {
  return useMutation({
    mutationFn: ({ sessionId, sectionId, note }: SaveNoteVariables) => saveSectionNote(sessionId, sectionId, note),
    onError: toastError,
  });
}

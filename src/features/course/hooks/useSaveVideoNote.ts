"use client";

import { useMutation } from "@tanstack/react-query";
import { saveVideoNote } from "../course.api";
import { toastError } from "@/shared/ui/toast";

interface SaveNoteVariables {
  sessionId: string;
  videoId: string;
  note: string;
}

/** Enregistre la note libre d'une vidéo ; l'erreur (429…) est signalée par un toast. */
export function useSaveVideoNote() {
  return useMutation({
    mutationFn: ({ sessionId, videoId, note }: SaveNoteVariables) => saveVideoNote(sessionId, videoId, note),
    onError: toastError,
  });
}

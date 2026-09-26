"use client";

import { useState } from "react";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { VIDEO_NOTE_MAX_LENGTH } from "@/shared/utils/constants";
import { useSaveVideoNote } from "../../hooks/useSaveVideoNote";

interface VideoNoteModalProps {
  sessionId: string;
  videoId: string;
  /** Titre de la vidéo (rappel dans le modal). */
  videoTitle: string;
  initialNote?: string;
  onSaved: (note: string) => void;
  onClose: () => void;
}

/**
 * Modal d'édition de la note personnelle d'une vidéo (pense-bête, idées).
 * Monté à la demande ; Échap ou clic sur le voile le ferme. Se ferme après enregistrement.
 */
export function VideoNoteModal({
  sessionId,
  videoId,
  videoTitle,
  initialNote = "",
  onSaved,
  onClose,
}: VideoNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const save = useSaveVideoNote();
  const dirty = note !== initialNote;
  // Limite sur le Markdown (ce que le backend reçoit) : l'éditeur riche n'a pas de maxLength
  const isOverLimit = note.length > VIDEO_NOTE_MAX_LENGTH;

  return (
    <Modal onClose={onClose} labelledBy={`video-note-modal-title-${videoId}`} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!dirty || isOverLimit) return;
          save.mutate(
            { sessionId, videoId, note },
            {
              onSuccess: (res) => {
                onSaved(res.note);
                onClose();
              },
            },
          );
        }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <StickyNote2OutlinedIcon fontSize="small" />
          </span>
          <div className="min-w-0">
            <h2 id={`video-note-modal-title-${videoId}`} className="text-base font-semibold text-gray-900">
              {initialNote ? "Modifier ma note" : "Ajouter une note"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-gray-500" title={videoTitle}>
              {videoTitle || "Vidéo sans titre"}
            </p>
          </div>
        </div>

        <p className="mt-4 mb-1 block text-xs font-medium text-gray-600">Note personnelle</p>
        <RichTextEditor
          id={`video-note-${videoId}`}
          ariaLabel="Note personnelle"
          autoFocus
          minRows={8}
          value={note}
          onChange={setNote}
          placeholder="Pense-bête, idées à creuser…"
          invalid={isOverLimit}
        />
        <p className={`mt-1 text-right text-xs ${isOverLimit ? "font-medium text-red-600" : "text-gray-400"}`}>
          {note.length}/{VIDEO_NOTE_MAX_LENGTH}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!dirty || isOverLimit}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

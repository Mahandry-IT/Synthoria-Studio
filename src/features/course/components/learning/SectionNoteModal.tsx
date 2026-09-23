"use client";

import { useEffect, useState } from "react";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { Button } from "@/components/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SECTION_NOTE_MAX_LENGTH } from "@/shared/utils/constants";
import { useSaveSectionNote } from "../../hooks/useSaveSectionNote";

interface SectionNoteModalProps {
  sessionId: string;
  sectionId: string;
  /** Titre de la section (rappel dans le modal). */
  sectionTitle: string;
  initialNote?: string;
  onSaved: (note: string) => void;
  onClose: () => void;
}

/**
 * Modal d'édition de la note personnelle d'une section (pense-bête, idées).
 * Monté à la demande ; Échap ou clic sur le voile le ferme. Se ferme après enregistrement.
 */
export function SectionNoteModal({
  sessionId,
  sectionId,
  sectionTitle,
  initialNote = "",
  onSaved,
  onClose,
}: SectionNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const save = useSaveSectionNote();
  const dirty = note !== initialNote;
  // Limite sur le Markdown (ce que le backend reçoit) : l'éditeur riche n'a pas de maxLength
  const isOverLimit = note.length > SECTION_NOTE_MAX_LENGTH;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`note-modal-title-${sectionId}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!dirty || isOverLimit) return;
          save.mutate(
            { sessionId, sectionId, note },
            {
              onSuccess: (res) => {
                onSaved(res.note);
                onClose();
              },
            },
          );
        }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <StickyNote2OutlinedIcon fontSize="small" />
          </span>
          <div className="min-w-0">
            <h2 id={`note-modal-title-${sectionId}`} className="text-base font-semibold text-gray-900">
              {initialNote ? "Modifier ma note" : "Ajouter une note"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-gray-500" title={sectionTitle}>
              {sectionTitle || "Section sans titre"}
            </p>
          </div>
        </div>

        <p className="mt-4 mb-1 block text-xs font-medium text-gray-600">Note personnelle</p>
        <RichTextEditor
          id={`note-${sectionId}`}
          ariaLabel="Note personnelle"
          autoFocus
          minRows={4}
          value={note}
          onChange={setNote}
          placeholder="Pense-bête, idées à creuser…"
          invalid={isOverLimit}
        />
        <p className={`mt-1 text-right text-xs ${isOverLimit ? "font-medium text-red-600" : "text-gray-400"}`}>
          {note.length}/{SECTION_NOTE_MAX_LENGTH}
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
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { SECTION_NOTE_MAX_LENGTH } from "@/shared/utils/constants";
import { useSaveSectionNote } from "../../hooks/useSaveSectionNote";

interface SectionNoteBoxProps {
  sessionId: string;
  sectionId: string;
  initialNote?: string;
  onSaved: (note: string) => void;
}

/**
 * Note personnelle libre sur une section (pense-bête, idées), repliée par défaut sauf si une note
 * existe déjà. Jamais générée par le modèle : reste éditable, même sur une section incomplète.
 */
export function SectionNoteBox({ sessionId, sectionId, initialNote = "", onSaved }: SectionNoteBoxProps) {
  const [open, setOpen] = useState(Boolean(initialNote));
  const [note, setNote] = useState(initialNote);
  const save = useSaveSectionNote();
  const dirty = note !== initialNote;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-indigo-600 hover:underline"
      >
        {initialNote ? "📝 Modifier ma note" : "📝 Ajouter une note"}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
      <label htmlFor={`note-${sectionId}`} className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Note personnelle
      </label>
      <textarea
        id={`note-${sectionId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={SECTION_NOTE_MAX_LENGTH}
        placeholder="Pense-bête, idées à creuser…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400">
          {note.length}/{SECTION_NOTE_MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
          <Button
            type="button"
            size="sm"
            loading={save.isPending}
            disabled={!dirty}
            onClick={() =>
              save.mutate(
                { sessionId, sectionId, note },
                { onSuccess: (res) => onSaved(res.note) },
              )
            }
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

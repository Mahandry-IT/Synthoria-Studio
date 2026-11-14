"use client";

import { useState } from "react";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { Button } from "@/components/Button";
import { SectionNoteModal } from "./SectionNoteModal";

interface SectionNoteButtonProps {
  sessionId: string;
  sectionId: string;
  sectionTitle: string;
  initialNote?: string;
  onSaved: (note: string) => void;
}

/**
 * Bouton icône (en-tête de section) ouvrant le modal de note personnelle.
 * Icône pleine quand une note existe déjà. Jamais générée par le modèle.
 */
export function SectionNoteButton({ sessionId, sectionId, sectionTitle, initialNote = "", onSaved }: SectionNoteButtonProps) {
  const [open, setOpen] = useState(false);
  const label = initialNote ? "Modifier ma note" : "Ajouter une note";

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        {initialNote ? <StickyNote2Icon fontSize="small" /> : <StickyNote2OutlinedIcon fontSize="small" />}
      </Button>
      {open && (
        <SectionNoteModal
          sessionId={sessionId}
          sectionId={sectionId}
          sectionTitle={sectionTitle}
          initialNote={initialNote}
          onSaved={onSaved}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

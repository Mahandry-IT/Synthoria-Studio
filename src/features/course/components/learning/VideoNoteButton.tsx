"use client";

import { useState } from "react";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { Button } from "@/components/Button";
import { VideoNoteModal } from "./VideoNoteModal";

interface VideoNoteButtonProps {
  sessionId: string;
  videoId: string;
  videoTitle: string;
  initialNote?: string;
  onSaved: (note: string) => void;
}

/**
 * Bouton icône (carte vidéo) ouvrant le modal de note personnelle.
 * Icône pleine quand une note existe déjà. Jamais générée par le modèle.
 */
export function VideoNoteButton({ sessionId, videoId, videoTitle, initialNote = "", onSaved }: VideoNoteButtonProps) {
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
        <VideoNoteModal
          sessionId={sessionId}
          videoId={videoId}
          videoTitle={videoTitle}
          initialNote={initialNote}
          onSaved={onSaved}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

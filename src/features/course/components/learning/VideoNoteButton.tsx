"use client";

import { useState } from "react";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
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
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {initialNote ? <StickyNote2Icon fontSize="small" /> : <StickyNote2OutlinedIcon fontSize="small" />}
      </button>
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

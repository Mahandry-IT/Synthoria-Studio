"use client";

import { useId, useState, type ReactNode } from "react";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";

interface CollapsibleFolderPanelProps {
  /** Libellé du dossier courant, affiché sur le bouton replié (mobile). */
  currentLabel: string;
  /** Classe du conteneur à partir de `lg` (toujours déplié) — ex. bordure/carte. */
  className?: string;
  children: ReactNode;
}

/**
 * Conteneur de `FolderNav` repliable sous `lg` : sur mobile/tablette, un bouton affiche le dossier
 * courant et déplie la navigation à la demande ; à partir de `lg`, la navigation est toujours
 * visible (colonne latérale).
 */
export function CollapsibleFolderPanel({ currentLabel, className = "", children }: CollapsibleFolderPanelProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 lg:hidden"
      >
        <FolderOutlinedIcon fontSize="small" className="text-gray-400" />
        <span className="min-w-0 flex-1 truncate">{currentLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div id={contentId} className={`${open ? "mt-2 block" : "hidden"} lg:mt-0 lg:block`}>
        {children}
      </div>
    </div>
  );
}

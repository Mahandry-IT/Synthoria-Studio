"use client";

import { useEffect, useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { Button } from "@/components/Button";
import { PLAN_INSTRUCTIONS_MAX_LENGTH } from "@/shared/utils/constants";

interface RefineSectionModalProps {
  /** Titre de la section à compléter (rappel dans le modal). */
  sectionTitle: string;
  /** Reçoit les précisions saisies (chaîne vide = l'IA décide seule de ce qui manque). */
  onSubmit: (instructions: string) => void;
  onCancel: () => void;
}

/**
 * Mini modal de complétion d'une section : champ facultatif pour dire à l'IA quoi ajouter.
 * Monté à la demande (état vierge à chaque ouverture) ; Échap ou clic sur le voile l'annule.
 */
export function RefineSectionModal({ sectionTitle, onSubmit, onCancel }: RefineSectionModalProps) {
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="refine-modal-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(instructions.trim());
        }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <AutoAwesomeIcon fontSize="small" />
          </span>
          <div className="min-w-0">
            <h2 id="refine-modal-title" className="text-base font-semibold text-gray-900">
              Compléter la section
            </h2>
            <p className="mt-0.5 truncate text-sm text-gray-500" title={sectionTitle}>
              {sectionTitle || "Section sans titre"}
            </p>
          </div>
        </div>

        <label htmlFor="refine-instructions" className="mt-4 block text-xs font-medium text-gray-600">
          Que faut-il ajouter ? <span className="font-normal text-gray-400">(facultatif)</span>
        </label>
        <AutoResizeTextarea
          id="refine-instructions"
          autoFocus
          rows={3}
          maxLength={PLAN_INSTRUCTIONS_MAX_LENGTH}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Ex. : ajouter le cas du régime transitoire, avec un exemple chiffré"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Laissez vide : l&apos;IA repère et ajoute d&apos;elle-même les informations manquantes.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            <AutoAwesomeIcon sx={{ fontSize: 16 }} />
            Compléter
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { PLAN_INSTRUCTIONS_MAX_LENGTH } from "@/shared/utils/constants";
import { useAddCourseSections } from "../../hooks/useAddCourseSections";
import type { AddCourseSectionsResponse } from "../../course.types";

interface AddCourseContentModalProps {
  sessionId: string;
  /** Le cours a déjà des pistes « Prochaines étapes » : change le placeholder/l'aide contextuelle. */
  hasNextSteps: boolean;
  onAdded: (result: AddCourseSectionsResponse) => void;
  onClose: () => void;
}

/**
 * Modal d'ajout de contenu à un cours déjà généré.
 * Champ Tiptap facultatif : vide, l'IA développe les « Prochaines étapes » du cours si elles
 * existent, sinon propose elle-même de nouveaux sujets pertinents. Rempli, le texte sert de
 * consigne pour les nouvelles sections générées.
 */
export function AddCourseContentModal({ sessionId, hasNextSteps, onAdded, onClose }: AddCourseContentModalProps) {
  const [instructions, setInstructions] = useState("");
  const add = useAddCourseSections();
  const isOverLimit = instructions.length > PLAN_INSTRUCTIONS_MAX_LENGTH;

  const emptyStateHint = hasNextSteps
    ? "Laissez vide : les « Prochaines étapes » du cours seront développées en sections."
    : "Laissez vide : l'IA propose elle-même de nouveaux sujets pertinents pour ce cours.";

  return (
    <Modal onClose={onClose} labelledBy="add-content-modal-title" size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isOverLimit) return;
          add.mutate(
            { sessionId, instructions: instructions.trim() },
            { onSuccess: (res) => { onAdded(res); onClose(); } },
          );
        }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <AutoAwesomeIcon fontSize="small" />
          </span>
          <div className="min-w-0">
            <h2 id="add-content-modal-title" className="text-base font-semibold text-gray-900">
              Ajouter du contenu
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">Une ou plusieurs sections seront ajoutées au cours.</p>
          </div>
        </div>

        <p className="mt-4 mb-1 block text-xs font-medium text-gray-600">
          Sujet à développer <span className="font-normal text-gray-400">(facultatif)</span>
        </p>
        <RichTextEditor
          id="add-course-content-instructions"
          ariaLabel="Sujet à développer"
          autoFocus
          minRows={5}
          value={instructions}
          onChange={setInstructions}
          placeholder="Ex. : ajoute une section sur le régime transitoire, avec un exemple chiffré"
          invalid={isOverLimit}
        />
        <p className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span>{emptyStateHint}</span>
          <span className={isOverLimit ? "font-medium text-red-600" : "text-gray-400"}>
            {instructions.length}/{PLAN_INSTRUCTIONS_MAX_LENGTH}
          </span>
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={add.isPending} disabled={isOverLimit}>
            <AutoAwesomeIcon sx={{ fontSize: 16 }} />
            Générer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

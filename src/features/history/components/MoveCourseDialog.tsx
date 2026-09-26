"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "../history.constants";
import type { CourseFolder, CourseHistoryItem } from "../history.types";

interface MoveCourseDialogProps {
  item: CourseHistoryItem;
  folders: CourseFolder[];
  loading?: boolean;
  onConfirm: (folder: string, subfolder: string | null) => void;
  onClose: () => void;
}

/**
 * Dialogue de déplacement d'un cours. Les champs sont des `<input list>` (datalist native) :
 * l'utilisateur choisit un dossier/sous-dossier existant dans les suggestions, ou tape un nouveau
 * nom pour le créer implicitement (un dossier n'est qu'un attribut du cours côté API).
 */
export function MoveCourseDialog({ item, folders, loading = false, onConfirm, onClose }: MoveCourseDialogProps) {
  const [folder, setFolder] = useState(item.folder);
  const [subfolder, setSubfolder] = useState(item.subfolder === DEFAULT_SUBFOLDER ? "" : item.subfolder);

  const subfolderOptions = useMemo(() => {
    const match = folders.find((f) => f.name === folder.trim());
    return match?.subfolders.map((s) => s.name).filter((name) => name !== DEFAULT_SUBFOLDER) ?? [];
  }, [folders, folder]);

  const trimmedFolder = folder.trim();
  const canSubmit = trimmedFolder.length > 0 && !loading;

  return (
    <Modal onClose={onClose} labelledBy="move-course-title" size="md">
      <h2 id="move-course-title" className="text-base font-semibold text-gray-900">
        Déplacer ce cours
      </h2>
      <p className="mt-0.5 text-sm text-gray-500">
        Choisissez un dossier existant dans les suggestions, ou tapez un nouveau nom pour en créer un.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="move-course-folder" className="mb-1 block text-xs font-medium text-gray-600">
            Dossier
          </label>
          <input
            id="move-course-folder"
            list="move-course-folder-options"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder={DEFAULT_FOLDER}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <datalist id="move-course-folder-options">
            {folders.map((f) => (
              <option key={f.name} value={f.name} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="move-course-subfolder" className="mb-1 block text-xs font-medium text-gray-600">
            Sous-dossier (optionnel)
          </label>
          <input
            id="move-course-subfolder"
            list="move-course-subfolder-options"
            value={subfolder}
            onChange={(e) => setSubfolder(e.target.value)}
            placeholder={DEFAULT_SUBFOLDER}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <datalist id="move-course-subfolder-options">
            {subfolderOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={loading}
          disabled={!canSubmit}
          onClick={() => onConfirm(trimmedFolder, subfolder.trim() || null)}
        >
          Déplacer
        </Button>
      </div>
    </Modal>
  );
}

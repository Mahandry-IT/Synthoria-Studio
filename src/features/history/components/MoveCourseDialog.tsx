"use client";

import { useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "../history.constants";
import type { CourseFolder, CourseHistoryItem } from "../history.types";

/** Style du champ MUI pour matcher les inputs Tailwind du reste de l'app (rounded-lg, border-gray-300, focus indigo). */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "#d1d5db" },
    "&:hover fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "1px" },
  },
  "& .MuiOutlinedInput-input": { padding: "0.5rem 0.75rem" },
} as const;

/** Trouve, parmi une liste de noms, celui qui correspond à `value` sans tenir compte de la casse. */
function findCaseInsensitive(names: string[], value: string): string | undefined {
  const target = value.trim().toLowerCase();
  return names.find((name) => name.toLowerCase() === target);
}

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

  const folderNames = useMemo(() => folders.map((f) => f.name), [folders]);

  const matchedFolder = useMemo(
    () => folders.find((f) => f.name.toLowerCase() === folder.trim().toLowerCase()),
    [folders, folder],
  );
  const subfolderOptions = useMemo(
    () => matchedFolder?.subfolders.map((s) => s.name).filter((name) => name !== DEFAULT_SUBFOLDER) ?? [],
    [matchedFolder],
  );

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
          <Autocomplete
            freeSolo
            options={folderNames}
            inputValue={folder}
            onInputChange={(_, value) => setFolder(value)}
            onBlur={() => {
              const match = findCaseInsensitive(folderNames, folder);
              if (match) setFolder(match);
            }}
            renderInput={(params) => (
              <TextField {...params} id="move-course-folder" placeholder={DEFAULT_FOLDER} size="small" sx={fieldSx} />
            )}
          />
        </div>

        <div>
          <label htmlFor="move-course-subfolder" className="mb-1 block text-xs font-medium text-gray-600">
            Sous-dossier (optionnel)
          </label>
          <Autocomplete
            freeSolo
            options={subfolderOptions}
            inputValue={subfolder}
            onInputChange={(_, value) => setSubfolder(value)}
            onBlur={() => {
              const match = findCaseInsensitive(subfolderOptions, subfolder);
              if (match) setSubfolder(match);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                id="move-course-subfolder"
                placeholder={DEFAULT_SUBFOLDER}
                size="small"
                sx={fieldSx}
              />
            )}
          />
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

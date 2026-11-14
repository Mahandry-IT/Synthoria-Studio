"use client";

import { useId, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "./folders.constants";
import type { FolderPlacement, FolderSummary } from "./folders.types";

/** Style du champ MUI pour matcher les champs du carnet (tokens : surface, line-strong, focus accent). */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "var(--r-md)",
    fontSize: "0.875rem",
    color: "var(--ink)",
    backgroundColor: "var(--surface)",
    "& fieldset": { borderColor: "var(--line-strong)" },
    "&:hover fieldset": { borderColor: "var(--line-strong)" },
    "&.Mui-focused fieldset": { borderColor: "var(--accent)", borderWidth: "2px" },
  },
  "& .MuiOutlinedInput-input": { padding: "0.5rem 0.875rem" },
} as const;

/** Trouve, parmi une liste de noms, celui qui correspond à `value` sans tenir compte de la casse. */
function findCaseInsensitive(names: string[], value: string): string | undefined {
  const target = value.trim().toLowerCase();
  return names.find((name) => name.toLowerCase() === target);
}

interface MoveToFolderDialogProps {
  /** Titre du dialogue (ex. « Déplacer ce cours »). */
  title: string;
  /** Emplacement actuel de l'élément, pré-rempli dans les champs. */
  current: FolderPlacement;
  folders: FolderSummary[];
  loading?: boolean;
  onConfirm: (folder: string, subfolder: string | null) => void;
  onClose: () => void;
}

/**
 * Dialogue de déplacement d'un élément vers un dossier/sous-dossier. Les champs sont des
 * Autocomplete libres : l'utilisateur choisit un dossier/sous-dossier existant dans les
 * suggestions, ou tape un nouveau nom pour le créer implicitement (un dossier n'est qu'un
 * attribut de l'élément côté API).
 */
export function MoveToFolderDialog({ title, current, folders, loading = false, onConfirm, onClose }: MoveToFolderDialogProps) {
  const idPrefix = useId();
  const titleId = `${idPrefix}-title`;
  const folderId = `${idPrefix}-folder`;
  const subfolderId = `${idPrefix}-subfolder`;

  const [folder, setFolder] = useState(current.folder);
  const [subfolder, setSubfolder] = useState(current.subfolder === DEFAULT_SUBFOLDER ? "" : current.subfolder);

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
    <Modal onClose={onClose} labelledBy={titleId} size="md">
      <h2 id={titleId} className="font-serif text-xl font-medium text-ink">
        {title}
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        Choisissez un dossier existant dans les suggestions, ou tapez un nouveau nom pour en créer un.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor={folderId} className="mb-1 block text-sm font-medium text-ink">
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
              <TextField {...params} id={folderId} placeholder={DEFAULT_FOLDER} size="small" sx={fieldSx} />
            )}
          />
        </div>

        <div>
          <label htmlFor={subfolderId} className="mb-1 block text-sm font-medium text-ink">
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
              <TextField {...params} id={subfolderId} placeholder={DEFAULT_SUBFOLDER} size="small" sx={fieldSx} />
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

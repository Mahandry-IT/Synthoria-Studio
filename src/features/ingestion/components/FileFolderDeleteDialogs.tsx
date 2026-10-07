"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "@/components/folders/folders.constants";
import type { FolderFilter } from "@/components/folders/folders.types";
import { useDeleteFileFolder } from "../hooks/useDeleteFileFolder";
import { useDeleteFileSubfolder } from "../hooks/useDeleteFileSubfolder";

/** Dossier ou sous-dossier dont la suppression attend confirmation. */
export type PendingFolderDeletion = { folder: string; subfolder?: string };

interface FileFolderDeleteDialogsProps {
  pending: PendingFolderDeletion | null;
  /** Filtre courant, réinitialisé s'il pointe vers le dossier supprimé. */
  filter: FolderFilter | null;
  onFilterChange: (filter: FolderFilter | null) => void;
  onClose: () => void;
}

/**
 * Confirmation de suppression d'un dossier ou d'un sous-dossier de fichiers. Aucun fichier n'est
 * supprimé : ils rejoignent le dossier (ou sous-dossier) par défaut.
 */
export function FileFolderDeleteDialogs({ pending, filter, onFilterChange, onClose }: FileFolderDeleteDialogsProps) {
  const deleteFolder = useDeleteFileFolder();
  const deleteSubfolder = useDeleteFileSubfolder();

  if (!pending) return null;
  const { folder, subfolder } = pending;

  if (subfolder === undefined) {
    return (
      <ConfirmDialog
        title={`Supprimer le dossier « ${folder} » ?`}
        description={`Les fichiers qu'il contient (et ceux de ses sous-dossiers) rejoindront le dossier « ${DEFAULT_FOLDER} ». Aucun fichier n'est supprimé.`}
        loading={deleteFolder.isPending}
        onConfirm={() =>
          deleteFolder.mutate(folder, {
            onSuccess: () => {
              if (filter?.folder === folder) onFilterChange(null);
              onClose();
            },
          })
        }
        onClose={onClose}
      />
    );
  }

  return (
    <ConfirmDialog
      title={`Supprimer le sous-dossier « ${subfolder} » ?`}
      description={`Les fichiers qu'il contient rejoindront « ${DEFAULT_SUBFOLDER} » dans « ${folder} ». Aucun fichier n'est supprimé.`}
      loading={deleteSubfolder.isPending}
      onConfirm={() =>
        deleteSubfolder.mutate(
          { folder, subfolder },
          {
            onSuccess: () => {
              if (filter?.folder === folder && filter.subfolder === subfolder) onFilterChange({ folder });
              onClose();
            },
          },
        )
      }
      onClose={onClose}
    />
  );
}

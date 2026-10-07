"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { FolderFilter } from "@/components/folders/folders.types";
import { useDeleteFile } from "../hooks/useDeleteFile";
import type { FileInfo } from "../ingestion.types";
import { FileList } from "./FileList";

interface IngestedFilesPanelProps {
  /** Dossier affiché ; `null` = tous les fichiers. */
  folderFilter: FolderFilter | null;
  /** Libellé du dossier affiché, en sous-titre. */
  folderLabel: string;
  onMove: (file: FileInfo) => void;
}

/**
 * Fichiers déjà ingérés du dossier courant : déplacement (bouton ou glisser sur un dossier) et
 * suppression (après confirmation) côté backend.
 */
export function IngestedFilesPanel({ folderFilter, folderLabel, onMove }: IngestedFilesPanelProps) {
  const [confirmingFilename, setConfirmingFilename] = useState<string | null>(null);
  const deleteMutation = useDeleteFile();

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Fichiers ingérés</h2>
        <p className="mt-0.5 truncate text-xs text-gray-500">{folderLabel}</p>
      </div>
      <FileList
        folderFilter={folderFilter}
        onDelete={setConfirmingFilename}
        onMove={onMove}
        draggable
        pageSize={5}
        scrollClassName=""
      />

      {confirmingFilename && (
        <ConfirmDialog
          title="Supprimer ce fichier ?"
          description={`« ${confirmingFilename} » sera définitivement supprimé et ne pourra plus servir de contexte pour de nouveaux cours. Les cours déjà générés ne sont pas affectés.`}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(confirmingFilename, { onSettled: () => setConfirmingFilename(null) })}
          onClose={() => setConfirmingFilename(null)}
        />
      )}
    </Card>
  );
}

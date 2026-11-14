"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { FolderFilter } from "@/components/folders/folders.types";
import { SectionHeading } from "@/components/PageHeader";
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
    <section className="space-y-3">
      <SectionHeading title="Fichiers ingérés" aside={<span className="kicker max-w-[50%] truncate">{folderLabel}</span>} />
      <FileList
        folderFilter={folderFilter}
        onDelete={setConfirmingFilename}
        onMove={onMove}
        draggable
        pageSize={5}
        scrollClassName=""
        emptyAction={
          <ButtonLink href="#import" variant="accent">
            Importer un PDF
          </ButtonLink>
        }
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
    </section>
  );
}

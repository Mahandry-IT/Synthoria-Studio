"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDeleteFile } from "../hooks/useDeleteFile";
import { FileList } from "./FileList";

/** Fichiers déjà ingérés, avec suppression (après confirmation) côté backend. */
export function IngestedFilesPanel() {
  const [confirmingFilename, setConfirmingFilename] = useState<string | null>(null);
  const deleteMutation = useDeleteFile();

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-base font-semibold text-gray-900">Fichiers ingérés</h2>
      <FileList onDelete={setConfirmingFilename} />

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

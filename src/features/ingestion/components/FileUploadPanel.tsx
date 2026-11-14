"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/ProgressBar";
import { useIngestPdf } from "../hooks/useIngestPdf";
import { MAX_PDF_SIZE_BYTES } from "@/shared/utils/constants";
import { cx } from "@/shared/utils/cx";
import type { FolderTarget } from "@/components/folders/folders.types";

interface FileUploadPanelProps {
  /** Dossier où ranger les fichiers envoyés ; absent = dossier par défaut. */
  target?: FolderTarget;
  /** Libellé du dossier de destination, affiché sous la zone de dépôt. */
  targetLabel: string;
}

/**
 * Panneau d'upload de fichiers PDF avec drag-and-drop, vers le dossier `target`.
 * Valide la taille côté client avant envoi au serveur. Les badges « Indexé » / « Échec » ne
 * concernent que les fichiers du dernier import : la liste des fichiers ne porte aucun état.
 */
export function FileUploadPanel({ target, targetLabel }: FileUploadPanelProps) {
  const { mutate, isPending, data } = useIngestPdf();
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setRejectedFiles(rejections.map((r) => r.file.name));

      if (acceptedFiles.length > 0) {
        mutate(acceptedFiles, target);
      }
    },
    [mutate, target],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_PDF_SIZE_BYTES,
    multiple: true,
  });

  const files = data?.files ?? [];
  const totalChunks = data?.total_chunks ?? 0;
  const totalDocs = data?.total_documents ?? 0;

  const failedFiles = files.filter((f) => f.status === "failed");
  const successFiles = files.filter((f) => f.status === "ok");

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cx(
          "flex flex-col items-center justify-center rounded-card border-[1.5px] border-dashed px-5 py-8 text-center",
          "transition-colors motion-reduce:transition-none",
          isDragActive
            ? "border-primary bg-primary-soft"
            : "border-line-strong bg-surface hover:border-primary hover:bg-sunken",
          isPending && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} aria-label="Upload de fichiers PDF" />
        <UploadFileOutlinedIcon sx={{ fontSize: 40 }} className="mb-3 text-primary" aria-hidden="true" />
        {isDragActive ? (
          <p className="font-serif text-lg font-medium text-primary">Déposez les fichiers ici…</p>
        ) : (
          <>
            <p className="font-serif text-lg font-medium text-ink">Glissez-déposez des PDF ici, ou</p>
            <span className="mt-3 inline-flex min-h-11 items-center rounded-ctrl border border-line-strong bg-bg px-4.5 text-sm font-semibold text-ink">
              Parcourir
            </span>
            <p className="mt-3 text-xs text-ink-2">PDF uniquement — max 10 Mo par fichier</p>
            <p className="mt-1 text-xs text-ink-2">
              Destination : <span className="font-medium text-ink">{targetLabel}</span>
            </p>
          </>
        )}
      </div>

      {isPending && (
        <div role="status" className="space-y-2 text-sm text-ink-2">
          <p>Envoi en cours…</p>
          <ProgressBar label="Envoi des fichiers en cours" />
        </div>
      )}

      {rejectedFiles.length > 0 && (
        <div className="rounded-card bg-warn-soft p-3 text-sm text-warn">
          <p className="font-medium">Fichiers rejetés (validation client) :</p>
          <ul className="mt-1 list-inside list-disc">
            {rejectedFiles.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {failedFiles.length > 0 && (
        <div className="rounded-card bg-err-soft p-3 text-sm text-ink">
          <p className="font-medium text-err">Fichiers échoués (serveur) :</p>
          <ul className="mt-2 space-y-1.5">
            {failedFiles.map((f) => (
              <li key={f.filename} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge variant="err">Échec</Badge>
                <span>
                  {f.filename} — {f.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {successFiles.length > 0 && (
        <div className="rounded-card bg-ok-soft p-4 text-sm text-ink">
          <p className="font-medium text-ok">
            {successFiles.length} fichier(s) ingéré(s) — {totalChunks} morceau(x), {totalDocs} document(s)
          </p>
          <ul className="mt-2 space-y-1.5">
            {successFiles.map((f) => (
              <li key={f.filename} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge variant="ok">Indexé</Badge>
                <span>
                  {f.filename}
                  {f.chunks_added != null && <span className="text-xs text-ink-2"> ({f.chunks_added} chunks)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

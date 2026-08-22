"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useIngestPdf } from "../hooks/useIngestPdf";
import { MAX_PDF_SIZE_BYTES } from "@/shared/utils/constants";

/**
 * Panneau d'upload de fichiers PDF avec drag-and-drop.
 * Valide la taille côté client avant envoi au serveur.
 */
export function FileUploadPanel() {
  const { mutate, isPending, data } = useIngestPdf();
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setRejectedFiles(rejections.map((r) => r.file.name));

      if (acceptedFiles.length > 0) {
        mutate(acceptedFiles);
      }
    },
    [mutate],
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
        className={[
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 hover:border-gray-400",
          isPending && "pointer-events-none opacity-60",
        ].join(" ")}
      >
        <input {...getInputProps()} aria-label="Upload de fichiers PDF" />
        <svg
          className="mb-3 h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          />
        </svg>
        {isDragActive ? (
          <p className="text-sm font-medium text-indigo-700">
            Déposez les fichiers ici…
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Glissez-déposez des PDF ici, ou{" "}
              <span className="text-indigo-600 underline">parcourir</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF uniquement — max 10 Mo par fichier
            </p>
          </>
        )}
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Envoi en cours…
        </div>
      )}

      {rejectedFiles.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Fichiers rejetés (validation client) :</p>
          <ul className="mt-1 list-inside list-disc">
            {rejectedFiles.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {failedFiles.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Fichiers échoués (serveur) :</p>
          <ul className="mt-1 list-inside list-disc">
            {failedFiles.map((f) => (
              <li key={f.filename}>
                ✗ {f.filename} — {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {successFiles.length > 0 && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">
            {successFiles.length} fichier(s) ingéré(s) — {totalChunks} morceau(x), {totalDocs} document(s)
          </p>
          <ul className="mt-2 space-y-1">
            {successFiles.map((f) => (
              <li key={f.filename} className="text-green-700">
                ✓ {f.filename}
                {f.chunks_added != null && (
                  <span className="text-xs opacity-75"> ({f.chunks_added} chunks)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

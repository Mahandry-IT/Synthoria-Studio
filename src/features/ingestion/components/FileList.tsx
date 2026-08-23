"use client";

import { useFiles } from "../hooks/useFiles";
import { Skeleton } from "@/components/Skeleton";

interface FileListProps {
  /** Callback quand un ou plusieurs fichiers sont sélectionnés */
  onSelect?: (filenames: string[]) => void;
  /** Filenames actuellement sélectionnés */
  selected?: string[];
  /** Multisélection activée */
  multi?: boolean;
}

/**
 * Liste des fichiers PDF ingestés avec support de sélection.
 * Utilisé dans le Mode 2 pour choisir le(s) fichier(s) de contexte.
 */
export function FileList({ onSelect, selected = [], multi = false }: FileListProps) {
  const { data, isLoading, error } = useFiles();

  if (isLoading) {
    return <Skeleton lines={3} className="p-4" />;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger la liste des fichiers.
      </p>
    );
  }

  if (!data || data.files.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aucun fichier PDF ingesté. Uploadez-en un dans l&apos;onglet précédent.
      </p>
    );
  }

  function toggle(filename: string) {
    if (!onSelect) return;

    if (multi) {
      const next = selected.includes(filename)
        ? selected.filter((f) => f !== filename)
        : [...selected, filename];
      onSelect(next);
    } else {
      onSelect(selected.includes(filename) ? [] : [filename]);
    }
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" role="listbox" aria-label="Fichiers disponibles">
      {data.files.map((file) => {
        const isSelected = selected.includes(file.filename);
        return (
          <li
            key={file.filename}
            role="option"
            aria-selected={isSelected}
            onClick={() => toggle(file.filename)}
            className={[
              "flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors",
              isSelected
                ? "bg-indigo-50 text-indigo-900"
                : "hover:bg-gray-50 text-gray-700",
            ].join(" ")}
          >
            <svg className="h-5 w-5 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0116 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 012 16.5v-13z" />
            </svg>
            <div className="flex-1 truncate">
              <span className="font-medium">{file.filename}</span>
              {file.chunks != null && (
                <span className="ml-2 text-xs text-gray-400">
                  {file.chunks} morceau{file.chunks > 1 ? "x" : ""}
                </span>
              )}
            </div>
            {isSelected && (
              <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </li>
        );
      })}
    </ul>
  );
}

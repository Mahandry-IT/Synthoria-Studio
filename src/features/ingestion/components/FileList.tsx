"use client";

import { useState, useMemo } from "react";
import { useAllFiles } from "../hooks/useAllFiles";
import { Skeleton } from "@/components/Skeleton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";

const DEFAULT_PAGE_SIZE = 10;
interface FileListProps {
  /** Callback quand un ou plusieurs fichiers sont sélectionnés */
  onSelect?: (filenames: string[]) => void;
  /** Filenames actuellement sélectionnés */
  selected?: string[];
  /** Multisélection activée */
  multi?: boolean;
  /** Terme de recherche pour filtrer les fichiers par nom */
  search?: string;
  /** Si fourni, chaque ligne affiche un bouton de suppression (la confirmation est à la charge de l'appelant) */
  onDelete?: (filename: string) => void;
  /** Nombre de fichiers par page */
  pageSize?: number;
  /** Hauteur max de la liste (défilement interne) ; sans valeur, la page entière est affichée */
  scrollClassName?: string;
}

/**
 * Liste paginée des fichiers PDF ingestés avec support de sélection et recherche.
 * Récupère tous les fichiers au montage, filtre et pagine côté client.
 */
export function FileList({ onSelect, selected = [], multi = false, search = "", onDelete, pageSize: initialPageSize = DEFAULT_PAGE_SIZE, scrollClassName = "max-h-48 overflow-y-auto" }: FileListProps) {
  // La page appartient à une recherche : quand elle change, on repart de la page 1 sans effet
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageState, setPageState] = useState({ search, page: 1 });
  const page = pageState.search === search ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ search, page: next });
  const { data: allFiles, isLoading, error } = useAllFiles();

  const filteredData = useMemo(() => {
    if (!allFiles.length && !isLoading) return [];
    if (!search.trim()) return allFiles;
    const q = search.trim().toLowerCase();
    return allFiles.filter((file) =>
      file.filename.toLowerCase().includes(q),
    );
  }, [allFiles, search, isLoading]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

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

  if (!isLoading && allFiles.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aucun fichier PDF ingesté. Uploadez-en un dans l&apos;onglet précédent.
      </p>
    );
  }

  if (filteredData.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aucun fichier ne correspond à « {search.trim()} ».
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
    <div>
      <div className={scrollClassName}>
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" role="listbox" aria-label="Fichiers disponibles">
          {paginatedData.map((file) => {
            const isSelected = selected.includes(file.filename);
            return (
              <li
                key={file.id}
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
                </div>
                {isSelected && (
                  <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    aria-label={`Supprimer le fichier ${file.filename}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(file.filename);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}

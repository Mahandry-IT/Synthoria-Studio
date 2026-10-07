"use client";

import { useState, useMemo } from "react";
import { useAllFiles } from "../hooks/useAllFiles";
import { visibleFiles } from "../fileFolders";
import { Skeleton } from "@/components/Skeleton";
import { Pagination } from "@/components/Pagination";
import type { FolderFilter } from "@/components/folders/folders.types";
import type { FileInfo } from "../ingestion.types";
import { FileRow } from "./FileRow";

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
  /** Dossier/sous-dossier affiché ; `null`/absent = tous les fichiers */
  folderFilter?: FolderFilter | null;
  /** Si fourni, chaque ligne affiche un bouton de suppression (la confirmation est à la charge de l'appelant) */
  onDelete?: (filename: string) => void;
  /** Si fourni, chaque ligne affiche un bouton « Déplacer vers un dossier » */
  onMove?: (file: FileInfo) => void;
  /** Les lignes peuvent être glissées sur un dossier (exige un `DndContext` parent) */
  draggable?: boolean;
  /** Nombre de fichiers par page */
  pageSize?: number;
  /** Hauteur max de la liste (défilement interne) ; sans valeur, la page entière est affichée */
  scrollClassName?: string;
}

/** Clé stable d'une vue, pour repartir de la page 1 quand recherche ou dossier changent. */
function viewKey(search: string, filter: FolderFilter | null): string {
  return JSON.stringify([search, filter?.folder ?? null, filter?.subfolder ?? null]);
}

/**
 * Liste plate et paginée des fichiers PDF ingérés, triée par nom, filtrable par dossier et par
 * recherche, avec sélection, déplacement et suppression optionnels.
 * Récupère tous les fichiers au montage, filtre et pagine côté client.
 */
export function FileList({
  onSelect,
  selected = [],
  multi = false,
  search = "",
  folderFilter = null,
  onDelete,
  onMove,
  draggable = false,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  scrollClassName = "max-h-48 overflow-y-auto",
}: FileListProps) {
  // La page appartient à une vue (recherche + dossier) : quand elle change, on repart de la page 1 sans effet
  const key = viewKey(search, folderFilter);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageState, setPageState] = useState({ key, page: 1 });
  const page = pageState.key === key ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key, page: next });
  const { data: allFiles, isLoading, error } = useAllFiles();

  const filteredData = useMemo(
    () => visibleFiles(allFiles, folderFilter, search),
    [allFiles, folderFilter, search],
  );

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

  if (allFiles.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aucun fichier PDF ingesté. Uploadez-en un dans l&apos;onglet précédent.
      </p>
    );
  }

  if (filteredData.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {search.trim()
          ? `Aucun fichier ne correspond à « ${search.trim()} ».`
          : "Aucun fichier dans ce dossier."}
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
          {paginatedData.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              isSelected={selected.includes(file.filename)}
              onToggle={() => toggle(file.filename)}
              draggable={draggable}
              showFolder={folderFilter === null}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
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

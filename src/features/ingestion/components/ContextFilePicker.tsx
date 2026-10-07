"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { CollapsibleFolderPanel } from "@/components/folders/CollapsibleFolderPanel";
import { FolderNav } from "@/components/folders/FolderNav";
import { filterLabel } from "@/components/folders/folders.utils";
import type { FolderFilter } from "@/components/folders/folders.types";
import { visibleFiles } from "../fileFolders";
import { useAllFiles } from "../hooks/useAllFiles";
import { useFileFolderTree } from "../hooks/useFileFolderTree";
import { FileList } from "./FileList";

const ALL_FILES_LABEL = "Tous les fichiers";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
  );
}

interface ContextFilePickerProps {
  /** Noms des fichiers sélectionnés, conservés quel que soit le dossier affiché. */
  selected: string[];
  onChange: (filenames: string[]) => void;
}

/**
 * Sélection des fichiers de contexte de /ask : navigation compacte par dossier (sans glisser-déposer
 * ni suppression), recherche, sélection multiple conservée d'un dossier à l'autre, sélection en
 * masse du dossier affiché et compteur toujours visible.
 */
export function ContextFilePicker({ selected, onChange }: ContextFilePickerProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FolderFilter | null>(null);
  const { data: allFiles } = useAllFiles();
  const { folders, isLoading: foldersLoading } = useFileFolderTree();

  const shownNames = useMemo(
    () => visibleFiles(allFiles, filter, search).map((f) => f.filename),
    [allFiles, filter, search],
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allShownSelected = shownNames.every((name) => selectedSet.has(name));

  function selectAllShown() {
    onChange([...selected, ...shownNames.filter((name) => !selectedSet.has(name))]);
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">
          Fichiers de contexte <span className="font-normal text-gray-400">(optionnel)</span>
        </p>
        <div className="relative w-full sm:w-56">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher…"
            aria-label="Rechercher un fichier de contexte"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[200px_1fr]">
        <CollapsibleFolderPanel
          currentLabel={filterLabel(filter, ALL_FILES_LABEL)}
          className="h-fit rounded-lg border border-gray-200 p-1"
        >
          <div className="max-h-48 overflow-y-auto">
            <FolderNav
              folders={folders}
              isLoading={foldersLoading}
              filter={filter}
              onSelect={setFilter}
              allLabel={ALL_FILES_LABEL}
              ariaLabel="Dossiers des fichiers de contexte"
              collapsedStorageKey="ask-collapsed-folders"
              droppable={false}
            />
          </div>
        </CollapsibleFolderPanel>

        <div className="min-w-0">
          <FileList onSelect={onChange} selected={selected} multi search={search} folderFilter={filter} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500" aria-live="polite">
          {selected.length} fichier(s) sélectionné(s)
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={selectAllShown}
            disabled={shownNames.length === 0 || allShownSelected}
          >
            {filter ? "Tout sélectionner dans ce dossier" : "Tout sélectionner"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])} disabled={selected.length === 0}>
            Tout désélectionner
          </Button>
        </div>
      </div>
    </div>
  );
}

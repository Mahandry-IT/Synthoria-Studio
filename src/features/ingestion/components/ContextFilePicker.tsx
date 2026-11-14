"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { ButtonLink } from "@/components/ButtonLink";
import { Input } from "@/components/Input";
import { CollapsibleFolderPanel } from "@/components/folders/CollapsibleFolderPanel";
import { FolderNav } from "@/components/folders/FolderNav";
import { filterLabel } from "@/components/folders/folders.utils";
import type { FolderFilter } from "@/components/folders/folders.types";
import { visibleFiles } from "../fileFolders";
import { useAllFiles } from "../hooks/useAllFiles";
import { useFileFolderTree } from "../hooks/useFileFolderTree";
import { FileList } from "./FileList";

const ALL_FILES_LABEL = "Tous les fichiers";

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
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">
        Fichiers de contexte <span className="font-normal text-ink-3">(optionnel)</span>
      </p>

      <Input
        type="search"
        placeholder="Rechercher…"
        aria-label="Rechercher un fichier de contexte"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <CollapsibleFolderPanel
        currentLabel={filterLabel(filter, ALL_FILES_LABEL)}
        className="h-fit rounded-ctrl border border-line p-1"
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
        <FileList
          onSelect={onChange}
          selected={selected}
          multi
          search={search}
          folderFilter={filter}
          emptyAction={
            <ButtonLink href="/upload#import" variant="accent">
              Importer un PDF
            </ButtonLink>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-2" aria-live="polite">
          {selected.length} fichier(s) sélectionné(s)
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={selectAllShown}
            disabled={shownNames.length === 0 || allShownSelected}
          >
            {filter ? "Tout sélectionner dans ce dossier" : "Tout sélectionner"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => onChange([])} disabled={selected.length === 0}>
            Tout désélectionner
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { Card } from "@/components/Card";
import { CollapsibleFolderPanel } from "@/components/folders/CollapsibleFolderPanel";
import { FolderNav } from "@/components/folders/FolderNav";
import { DEFAULT_FOLDER } from "@/components/folders/folders.constants";
import { MoveToFolderDialog } from "@/components/folders/MoveToFolderDialog";
import { innermostPointerWithin, resolveDropMove, type DragData, type DropTarget } from "@/components/folders/folders.dnd";
import { filterLabel } from "@/components/folders/folders.utils";
import { useFolderDndSensors } from "@/components/folders/useFolderDndSensors";
import type { FolderFilter } from "@/components/folders/folders.types";
import { uploadTarget } from "../fileFolders";
import { useFileFolderTree } from "../hooks/useFileFolderTree";
import { useMoveFileToFolder } from "../hooks/useMoveFileToFolder";
import type { FileInfo } from "../ingestion.types";
import { FileFolderDeleteDialogs, type PendingFolderDeletion } from "./FileFolderDeleteDialogs";
import { FileUploadPanel } from "./FileUploadPanel";
import { IngestedFilesPanel } from "./IngestedFilesPanel";

const ALL_FILES_LABEL = "Tous les fichiers";

/**
 * Espace de la page Upload, en deux colonnes : navigation des dossiers de fichiers à gauche
 * (repliable sous `lg`), upload vers le dossier sélectionné et liste filtrée à droite. Un fichier
 * se range par glisser-déposer sur un dossier ou via le bouton « Déplacer ».
 */
export function UploadWorkspace() {
  const [filter, setFilter] = useState<FolderFilter | null>(null);
  const [movingFile, setMovingFile] = useState<FileInfo | null>(null);
  const [draggedFile, setDraggedFile] = useState<FileInfo | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingFolderDeletion | null>(null);

  const { folders, isLoading: foldersLoading } = useFileFolderTree();
  const moveFile = useMoveFileToFolder();
  const sensors = useFolderDndSensors();
  const target = useMemo(() => uploadTarget(filter), [filter]);
  const currentLabel = filterLabel(filter, ALL_FILES_LABEL);

  function handleDragStart(event: DragStartEvent) {
    setDraggedFile((event.active.data.current as DragData<FileInfo> | undefined)?.item ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedFile(null);
    if (!event.over) return; // déposé hors du panneau de dossiers : glisser annulé, aucun effet
    const move = resolveDropMove(
      event.active.data.current as DragData<FileInfo> | undefined,
      event.over.data.current as DropTarget | undefined,
    );
    if (move) moveFile.mutate({ filename: move.item.filename, ...move.placement });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={innermostPointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggedFile(null)}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <Card className="h-fit p-3">
            <CollapsibleFolderPanel currentLabel={currentLabel}>
              <FolderNav
                folders={folders}
                isLoading={foldersLoading}
                filter={filter}
                onSelect={setFilter}
                allLabel={ALL_FILES_LABEL}
                ariaLabel="Dossiers de fichiers"
                collapsedStorageKey="upload-collapsed-folders"
                onDeleteFolder={(folder) => setPendingDeletion({ folder })}
                onDeleteSubfolder={(folder, subfolder) => setPendingDeletion({ folder, subfolder })}
              />
            </CollapsibleFolderPanel>
          </Card>

          <div className="min-w-0 space-y-6">
            <FileUploadPanel target={target} targetLabel={filter ? currentLabel : `${DEFAULT_FOLDER} (par défaut)`} />
            <IngestedFilesPanel folderFilter={filter} folderLabel={currentLabel} onMove={setMovingFile} />
          </div>
        </div>

        <DragOverlay>
          {draggedFile && (
            <div className="max-w-xs truncate rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-lg">
              {draggedFile.filename}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {movingFile && (
        <MoveToFolderDialog
          title="Déplacer ce fichier"
          current={movingFile}
          folders={folders}
          loading={moveFile.isPending}
          onConfirm={(folder, subfolder) =>
            moveFile.mutate(
              { filename: movingFile.filename, folder, subfolder },
              { onSuccess: () => setMovingFile(null) },
            )
          }
          onClose={() => setMovingFile(null)}
        />
      )}

      <FileFolderDeleteDialogs
        pending={pendingDeletion}
        filter={filter}
        onFilterChange={setFilter}
        onClose={() => setPendingDeletion(null)}
      />
    </>
  );
}

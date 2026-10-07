"use client";

import { useDraggable } from "@dnd-kit/core";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { folderLabel } from "@/components/folders/folders.utils";
import type { DragData } from "@/components/folders/folders.dnd";
import type { FileInfo } from "../ingestion.types";

interface FileRowProps {
  file: FileInfo;
  isSelected: boolean;
  onToggle: () => void;
  /** La ligne peut être glissée sur un dossier (exige un `DndContext` parent). */
  draggable: boolean;
  /** Affiche le badge de dossier (vue « Tous les fichiers »). */
  showFolder: boolean;
  onMove?: (file: FileInfo) => void;
  onDelete?: (filename: string) => void;
}

/**
 * Ligne de `FileList`. Seuls les écouteurs pointeur du glisser sont posés sur la ligne (pas ses
 * attributs ARIA, qui écraseraient `role="option"`) : au clavier, le bouton « Déplacer » est
 * l'alternative accessible au glisser-déposer.
 */
export function FileRow({ file, isSelected, onToggle, draggable, showFolder, onMove, onDelete }: FileRowProps) {
  const dragData: DragData<FileInfo> = { item: file };
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: `file-${file.filename}`,
    data: dragData,
    disabled: !draggable,
  });

  return (
    <li
      ref={setNodeRef}
      {...(draggable ? listeners : {})}
      role="option"
      aria-selected={isSelected}
      onClick={onToggle}
      className={[
        "flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors",
        isSelected ? "bg-indigo-50 text-indigo-900" : "hover:bg-gray-50 text-gray-700",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <svg className="h-5 w-5 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0116 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 012 16.5v-13z" />
      </svg>
      <div className="min-w-0 flex-1 truncate">
        <span className="font-medium">{file.filename}</span>
      </div>
      {showFolder && (
        <Badge variant="gray" className="hidden max-w-[40%] truncate sm:inline-flex">
          {folderLabel(file)}
        </Badge>
      )}
      {isSelected && (
        <svg className="h-5 w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {onMove && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-label={`Déplacer le fichier ${file.filename}`}
          title="Déplacer vers un dossier"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onMove(file);
          }}
        >
          <DriveFileMoveOutlinedIcon fontSize="small" />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          size="sm"
          variant="danger"
          aria-label={`Supprimer le fichier ${file.filename}`}
          onPointerDown={(event) => event.stopPropagation()}
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
}

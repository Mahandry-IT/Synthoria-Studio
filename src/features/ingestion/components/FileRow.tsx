"use client";

import { useDraggable } from "@dnd-kit/core";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { folderLabel } from "@/components/folders/folders.utils";
import type { DragData } from "@/components/folders/folders.dnd";
import { cx } from "@/shared/utils/cx";
import type { FileInfo } from "../ingestion.types";

interface FileRowProps {
  file: FileInfo;
  isSelected: boolean;
  onToggle: () => void;
  /** Une sélection est possible : la case visuelle est affichée et la ligne bascule au clic. */
  selectable: boolean;
  /** La ligne peut être glissée sur un dossier (exige un `DndContext` parent). */
  draggable: boolean;
  /** Affiche le badge de dossier (vue « Tous les fichiers »). */
  showFolder: boolean;
  onMove?: (file: FileInfo) => void;
  onDelete?: (filename: string) => void;
}

/** Case de sélection visuelle (22 px) : l'état est porté par `aria-selected` de la ligne `option`. */
function SelectionBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
        checked ? "border-primary bg-primary text-primary-ink" : "border-line-strong bg-surface",
      )}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
      )}
    </span>
  );
}

/**
 * Ligne de `FileList`. Seuls les écouteurs pointeur du glisser sont posés sur la ligne (pas ses
 * attributs ARIA, qui écraseraient `role="option"`) : au clavier, le bouton « Déplacer » est
 * l'alternative accessible au glisser-déposer.
 */
export function FileRow({ file, isSelected, onToggle, selectable, draggable, showFolder, onMove, onDelete }: FileRowProps) {
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
      className={cx(
        "flex min-h-14 items-center gap-3 border-b border-line px-2 py-2 text-sm text-ink transition-colors motion-reduce:transition-none",
        selectable && "cursor-pointer",
        isSelected ? "bg-primary-soft" : "hover:bg-sunken",
        isDragging && "opacity-40",
      )}
    >
      {selectable && <SelectionBox checked={isSelected} />}
      <svg className="h-5 w-5 shrink-0 text-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0116 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 012 16.5v-13z" />
      </svg>
      <div className="min-w-0 flex-1 truncate">
        <span className="font-medium">{file.filename}</span>
      </div>
      {showFolder && (
        <Badge variant="neutral" className="hidden max-w-[40%] truncate sm:inline-flex">
          {folderLabel(file)}
        </Badge>
      )}
      {onMove && (
        <Button
          type="button"
          size="icon"
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
          size="icon"
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

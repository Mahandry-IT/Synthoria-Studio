"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { markdownToPlain } from "@/shared/utils/markdown";
import { cx } from "@/shared/utils/cx";
import { folderLabel } from "@/components/folders/folders.utils";
import type { DragData } from "@/components/folders/folders.dnd";
import type { CourseHistoryItem } from "../history.types";
import { formatHistoryDateTime, historyModeLabel } from "../history.utils";

interface HistoryItemProps {
  item: CourseHistoryItem;
  onDeleteClick: (id: string) => void;
  onMoveClick: (item: CourseHistoryItem) => void;
  /** Affiche le dossier — utile en vue « Tous les cours », redondant dans un dossier déjà filtré. */
  showFolder?: boolean;
  /** Classe de grille des colonnes (à partir de `md`), fournie par la liste pour aligner l'en-tête. */
  gridClassName: string;
}

/**
 * Ligne d'historique : titre et date, dossier, type, boutons déplacer/supprimer. Le lien et les
 * boutons sont des éléments cliquables distincts (jamais un bouton dans un lien). En mobile, la
 * ligne s'empile : titre et actions, puis dossier et type.
 */
export function HistoryItem({ item, onDeleteClick, onMoveClick, showFolder = false, gridClassName }: HistoryItemProps) {
  const dragData: DragData<CourseHistoryItem> = { item };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, data: dragData });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cx(
        "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-ctrl px-2 py-3 transition-colors hover:bg-sunken motion-reduce:transition-none md:gap-y-0",
        gridClassName,
        isDragging && "opacity-40",
      )}
    >
      <Link href={`/history/${item.id}`} className="col-start-1 row-start-1 block min-w-0 py-1">
        <span className="line-clamp-2 font-serif text-lg leading-snug font-medium text-ink">
          {markdownToPlain(item.question)}
        </span>
        <span className="mt-0.5 block font-mono text-xs text-ink-3">{formatHistoryDateTime(item.created_at)}</span>
      </Link>
      <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-2 md:contents">
        {showFolder && <span className="min-w-0 truncate text-sm text-ink-2">{folderLabel(item)}</span>}
        <span>
          <Badge variant={item.mode === "file_question" ? "info" : "neutral"}>{historyModeLabel(item.mode)}</Badge>
        </span>
      </div>
      <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 md:col-auto md:row-auto">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="Déplacer vers un dossier"
          title="Déplacer vers un dossier"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onMoveClick(item)}
        >
          <DriveFileMoveOutlinedIcon fontSize="small" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="danger"
          aria-label="Supprimer ce cours"
          title="Supprimer ce cours"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDeleteClick(item.id)}
        >
          <DeleteOutlineIcon fontSize="small" />
        </Button>
      </div>
    </div>
  );
}

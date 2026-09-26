import { pointerWithin, type CollisionDetection } from "@dnd-kit/core";
import type { CourseHistoryItem } from "./history.types";

/** `data` porté par la carte de cours glissée (`useDraggable` dans `HistoryItem`). */
export interface DragData {
  item: CourseHistoryItem;
}

/** `data` porté par une zone de dépôt de `FolderNav` (`useDroppable`). */
export type DropTarget =
  | { kind: "subfolder"; folder: string; subfolder: string }
  | { kind: "folder"; folder: string }
  | { kind: "default" };

/**
 * Les zones de dépôt de `FolderNav` sont imbriquées (nav > dossier > sous-dossier) : leurs aires se
 * chevauchent, donc `pointerWithin` seul peut retourner plusieurs collisions au même point. On ne
 * garde que la plus petite (la plus spécifique), pour qu'un dépôt sur un sous-dossier résolve à ce
 * sous-dossier et non à son dossier parent ou à la zone de repli.
 */
export const innermostPointerWithin: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  if (collisions.length <= 1) return collisions;

  const area = (id: string | number): number => {
    const rect = args.droppableRects.get(id);
    return rect ? rect.width * rect.height : Infinity;
  };

  const innermost = collisions.reduce((best, c) => (area(c.id) < area(best.id) ? c : best));
  return [innermost];
};

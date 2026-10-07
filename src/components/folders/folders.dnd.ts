import { pointerWithin, type CollisionDetection } from "@dnd-kit/core";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "./folders.constants";
import type { FolderPlacement } from "./folders.types";

/** `data` porté par l'élément glissé (`useDraggable`) : cours, fichier… */
export interface DragData<T> {
  item: T;
}

/** `data` porté par une zone de dépôt de `FolderNav` (`useDroppable`). */
export type DropTarget =
  | { kind: "subfolder"; folder: string; subfolder: string }
  | { kind: "folder"; folder: string }
  | { kind: "default" };

/**
 * Emplacement visé par un dépôt : la zone de repli vise le dossier par défaut, un dossier sans
 * sous-dossier précis vise son sous-dossier par défaut.
 */
export function dropTargetPlacement(target: DropTarget): FolderPlacement {
  return {
    folder: target.kind === "default" ? DEFAULT_FOLDER : target.folder,
    subfolder: target.kind === "subfolder" ? target.subfolder : DEFAULT_SUBFOLDER,
  };
}

/** Vrai si les deux emplacements sont identiques (un dépôt dessus est alors sans effet). */
export function isSamePlacement(a: FolderPlacement, b: FolderPlacement): boolean {
  return a.folder === b.folder && a.subfolder === b.subfolder;
}

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

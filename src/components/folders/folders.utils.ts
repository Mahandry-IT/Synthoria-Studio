import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "./folders.constants";
import type { FolderFilter, FolderPlacement } from "./folders.types";

/** Libellé court d'un emplacement : « Dossier », « Dossier / Sous-dossier ». */
export function folderLabel({ folder, subfolder }: FolderPlacement): string {
  if (folder === DEFAULT_FOLDER && subfolder === DEFAULT_SUBFOLDER) return DEFAULT_FOLDER;
  return subfolder === DEFAULT_SUBFOLDER ? folder : `${folder} / ${subfolder}`;
}

/** Libellé du filtre courant, `allLabel` quand aucun dossier n'est sélectionné. */
export function filterLabel(filter: FolderFilter | null, allLabel: string): string {
  if (!filter) return allLabel;
  return filter.subfolder ? `${filter.folder} / ${filter.subfolder}` : filter.folder;
}

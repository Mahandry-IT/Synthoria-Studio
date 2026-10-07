/**
 * Types génériques du rangement en dossiers/sous-dossiers (2 niveaux fixes), partagés par
 * l'historique des cours et les fichiers ingérés. Un dossier n'est qu'un attribut porté par
 * chaque élément côté API : il n'existe qu'autant qu'au moins un élément y est rangé.
 */

/** Emplacement d'un élément. */
export interface FolderPlacement {
  folder: string;
  subfolder: string;
}

export interface SubfolderSummary {
  name: string;
  /** Nombre d'éléments rangés dans ce sous-dossier. */
  count: number;
}

export interface FolderSummary {
  name: string;
  /** Nombre d'éléments du dossier, tous sous-dossiers confondus. */
  count: number;
  subfolders: SubfolderSummary[];
}

/** Destination d'un déplacement : `subfolder` omis/null = sous-dossier par défaut du dossier. */
export interface FolderTarget {
  folder: string;
  subfolder?: string | null;
}

/** Filtre courant par dossier. `null` (hors de ce type) = tous les éléments. */
export interface FolderFilter {
  folder: string;
  subfolder?: string;
}

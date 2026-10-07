import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "@/components/folders/folders.constants";
import type { FolderFilter, FolderPlacement, FolderSummary, FolderTarget } from "@/components/folders/folders.types";
import type { FileInfo } from "./ingestion.types";

/** Comparaison alphabétique insensible à la casse et aux accents. */
const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

/** Trie des noms de dossiers : `defaultName` en premier, puis ordre alphabétique. */
function compareFolderNames(defaultName: string) {
  return (a: string, b: string): number => {
    if (a === defaultName) return b === defaultName ? 0 : -1;
    if (b === defaultName) return 1;
    return collator.compare(a, b);
  };
}

/**
 * Arborescence des dossiers réellement utilisés par `files`, avec leurs compteurs (un dossier
 * n'existe qu'autant qu'au moins un fichier y est rangé). Dossier et sous-dossier par défaut en
 * premier, puis ordre alphabétique insensible à la casse et aux accents.
 */
export function buildFolderTree(files: readonly FolderPlacement[]): FolderSummary[] {
  const counts = new Map<string, Map<string, number>>();
  for (const { folder, subfolder } of files) {
    const subfolders = counts.get(folder) ?? new Map<string, number>();
    subfolders.set(subfolder, (subfolders.get(subfolder) ?? 0) + 1);
    counts.set(folder, subfolders);
  }

  const bySubfolder = compareFolderNames(DEFAULT_SUBFOLDER);
  return [...counts.keys()].sort(compareFolderNames(DEFAULT_FOLDER)).map((name) => {
    const subfolders = counts.get(name)!;
    const names = [...subfolders.keys()].sort(bySubfolder);
    return {
      name,
      count: names.reduce((sum, s) => sum + subfolders.get(s)!, 0),
      subfolders: names.map((s) => ({ name: s, count: subfolders.get(s)! })),
    };
  });
}

/** Fichiers rangés dans le dossier (tous sous-dossiers confondus) ou le sous-dossier filtré. */
export function filterFilesByFolder<T extends FolderPlacement>(files: readonly T[], filter: FolderFilter | null): T[] {
  if (!filter) return [...files];
  return files.filter(
    (f) => f.folder === filter.folder && (filter.subfolder === undefined || f.subfolder === filter.subfolder),
  );
}

/** Copie triée par nom de fichier (insensible à la casse et aux accents). */
export function sortFilesByName<T extends Pick<FileInfo, "filename">>(files: readonly T[]): T[] {
  return [...files].sort((a, b) => collator.compare(a.filename, b.filename));
}

/**
 * Fichiers affichés : filtrés par dossier puis par recherche sur le nom, en liste plate triée par
 * nom. Source unique pour la liste et pour « Tout sélectionner dans ce dossier ».
 */
export function visibleFiles(files: readonly FileInfo[], filter: FolderFilter | null, search: string): FileInfo[] {
  const q = search.trim().toLowerCase();
  const inFolder = filterFilesByFolder(files, filter);
  const matching = q ? inFolder.filter((f) => f.filename.toLowerCase().includes(q)) : inFolder;
  return sortFilesByName(matching);
}

/** Destination d'un upload depuis le filtre courant : « tous les fichiers » = dossier par défaut. */
export function uploadTarget(filter: FolderFilter | null): FolderTarget | undefined {
  if (!filter) return undefined;
  return filter.subfolder ? { folder: filter.folder, subfolder: filter.subfolder } : { folder: filter.folder };
}

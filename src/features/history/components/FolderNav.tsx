"use client";

import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useCourseFolders } from "../hooks/useCourseFolders";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "../history.constants";
import type { CourseFolderFilter } from "../history.types";

interface FolderNavProps {
  filter: CourseFolderFilter | null;
  onSelect: (filter: CourseFolderFilter | null) => void;
  onDeleteFolder: (name: string) => void;
  onDeleteSubfolder: (folder: string, subfolder: string) => void;
}

/**
 * Arborescence des dossiers de cours (2 niveaux fixes, jamais plus profond). Toujours dépliée :
 * le nombre de dossiers/sous-dossiers reste modeste, pas besoin d'un mécanisme de repli.
 */
export function FolderNav({ filter, onSelect, onDeleteFolder, onDeleteSubfolder }: FolderNavProps) {
  const { data: folders, isLoading } = useCourseFolders();

  return (
    <nav aria-label="Dossiers de cours" className="space-y-0.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          filter === null ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        Tous les cours
      </button>

      {isLoading && <p className="px-3 py-2 text-xs text-gray-400">Chargement…</p>}

      {folders.map((f) => {
        const isFolderActive = filter?.folder === f.name && !filter.subfolder;
        return (
          <div key={f.name} className="group">
            <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
              <button
                type="button"
                onClick={() => onSelect({ folder: f.name })}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors ${
                  isFolderActive ? "text-indigo-700" : "text-gray-700 hover:text-gray-900"
                }`}
              >
                <FolderOutlinedIcon
                  fontSize="small"
                  className={isFolderActive ? "text-indigo-600" : "text-gray-400"}
                />
                <span className="truncate">{f.name}</span>
                <span className="text-xs font-normal text-gray-400">{f.course_count}</span>
              </button>
              {f.name !== DEFAULT_FOLDER && (
                <button
                  type="button"
                  aria-label={`Supprimer le dossier ${f.name}`}
                  title="Supprimer le dossier"
                  onClick={() => onDeleteFolder(f.name)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-300 opacity-0 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 group-hover:opacity-100"
                >
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </button>
              )}
            </div>

            {f.subfolders.length > 0 && (
              <div className="ml-5 space-y-0.5 border-l border-gray-100 pl-2">
                {f.subfolders.map((s) => {
                  const isSubActive = filter?.folder === f.name && filter.subfolder === s.name;
                  return (
                    <div key={s.name} className="group/sub flex items-center justify-between rounded-lg px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => onSelect({ folder: f.name, subfolder: s.name })}
                        className={`flex min-w-0 flex-1 items-center gap-2 truncate rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                          isSubActive ? "font-medium text-indigo-700" : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        <span className="text-xs text-gray-400">{s.course_count}</span>
                      </button>
                      {s.name !== DEFAULT_SUBFOLDER && (
                        <button
                          type="button"
                          aria-label={`Supprimer le sous-dossier ${s.name}`}
                          title="Supprimer le sous-dossier"
                          onClick={() => onDeleteSubfolder(f.name, s.name)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-300 opacity-0 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 group-hover/sub:opacity-100"
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

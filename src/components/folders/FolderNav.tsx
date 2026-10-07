"use client";

import { useDroppable } from "@dnd-kit/core";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "./folders.constants";
import { useLocalStorageState } from "@/shared/hooks/useLocalStorageState";
import type { DropTarget } from "./folders.dnd";
import type { FolderFilter, FolderSummary, SubfolderSummary } from "./folders.types";

/** Highlight sobre (même famille que l'état « dossier actif ») pendant le survol d'un glisser. */
const DROP_ACTIVE_CLASS = "bg-indigo-50 ring-1 ring-indigo-400";

const DELETE_BUTTON_CLASS =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-300 opacity-0 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500";

interface FolderNavProps {
  folders: FolderSummary[];
  isLoading?: boolean;
  filter: FolderFilter | null;
  onSelect: (filter: FolderFilter | null) => void;
  /** Libellé de l'entrée « tous les éléments » (ex. « Tous les cours »). */
  allLabel: string;
  /** Libellé accessible du `<nav>` (ex. « Dossiers de cours »). */
  ariaLabel: string;
  /** Clé localStorage de la liste des dossiers repliés (une par écran, pour ne pas les mêler). */
  collapsedStorageKey: string;
  /** Absent = pas de bouton de suppression de dossier. */
  onDeleteFolder?: (name: string) => void;
  /** Absent = pas de bouton de suppression de sous-dossier. */
  onDeleteSubfolder?: (folder: string, subfolder: string) => void;
  /** Les dossiers servent de zones de dépôt (exige un `DndContext` parent). Vrai par défaut. */
  droppable?: boolean;
}

function SubfolderRow({
  folder,
  subfolder,
  isActive,
  droppable,
  onSelect,
  onDeleteSubfolder,
}: {
  folder: string;
  subfolder: SubfolderSummary;
  isActive: boolean;
  droppable: boolean;
  onSelect: () => void;
  onDeleteSubfolder?: () => void;
}) {
  const target: DropTarget = { kind: "subfolder", folder, subfolder: subfolder.name };
  const { setNodeRef, isOver } = useDroppable({
    id: `subfolder-${folder}-${subfolder.name}`,
    data: target,
    disabled: !droppable,
  });

  return (
    <div
      ref={setNodeRef}
      className={`group/sub flex items-center justify-between rounded-lg px-1 py-0.5 transition-colors ${
        isOver ? DROP_ACTIVE_CLASS : ""
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-w-0 flex-1 items-center gap-2 truncate rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
          isActive ? "font-medium text-indigo-700" : "text-gray-500 hover:text-gray-900"
        }`}
      >
        <span className="truncate">{subfolder.name}</span>
        <span className="text-xs text-gray-400">{subfolder.count}</span>
      </button>
      {onDeleteSubfolder && subfolder.name !== DEFAULT_SUBFOLDER && (
        <button
          type="button"
          aria-label={`Supprimer le sous-dossier ${subfolder.name}`}
          title="Supprimer le sous-dossier"
          onClick={onDeleteSubfolder}
          className={`${DELETE_BUTTON_CLASS} group-hover/sub:opacity-100`}
        >
          <DeleteOutlineIcon sx={{ fontSize: 14 }} />
        </button>
      )}
    </div>
  );
}

function ChevronButton({ name, isExpanded, onToggle }: { name: string; isExpanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? `Réduire le dossier ${name}` : `Déplier le dossier ${name}`}
      className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
    >
      <svg
        className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function FolderRow({
  folder,
  isActive,
  filter,
  isExpanded,
  droppable,
  onToggle,
  onSelect,
  onDeleteFolder,
  onDeleteSubfolder,
}: {
  folder: FolderSummary;
  isActive: boolean;
  filter: FolderFilter | null;
  isExpanded: boolean;
  droppable: boolean;
  onToggle: () => void;
  onSelect: (filter: FolderFilter | null) => void;
  onDeleteFolder?: (name: string) => void;
  onDeleteSubfolder?: (folder: string, subfolder: string) => void;
}) {
  const target: DropTarget = { kind: "folder", folder: folder.name };
  const { setNodeRef, isOver } = useDroppable({ id: `folder-${folder.name}`, data: target, disabled: !droppable });
  const hasSubfolders = folder.subfolders.length > 0;

  return (
    <div className="group">
      <div
        ref={setNodeRef}
        className={`flex items-center justify-between rounded-lg px-1 py-0.5 transition-colors ${
          isOver ? DROP_ACTIVE_CLASS : ""
        }`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          {hasSubfolders && <ChevronButton name={folder.name} isExpanded={isExpanded} onToggle={onToggle} />}
        </span>
        <button
          type="button"
          onClick={() => onSelect({ folder: folder.name })}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors ${
            isActive ? "text-indigo-700" : "text-gray-700 hover:text-gray-900"
          }`}
        >
          <FolderOutlinedIcon fontSize="small" className={isActive ? "text-indigo-600" : "text-gray-400"} />
          <span className="truncate">{folder.name}</span>
          <span className="text-xs font-normal text-gray-400">{folder.count}</span>
        </button>
        {onDeleteFolder && folder.name !== DEFAULT_FOLDER && (
          <button
            type="button"
            aria-label={`Supprimer le dossier ${folder.name}`}
            title="Supprimer le dossier"
            onClick={() => onDeleteFolder(folder.name)}
            className={`${DELETE_BUTTON_CLASS} group-hover:opacity-100`}
          >
            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
          </button>
        )}
      </div>

      {hasSubfolders && isExpanded && (
        <div className="ml-5 space-y-0.5 border-l border-gray-100 pl-2">
          {folder.subfolders.map((s) => (
            <SubfolderRow
              key={s.name}
              folder={folder.name}
              subfolder={s}
              droppable={droppable}
              isActive={filter?.folder === folder.name && filter.subfolder === s.name}
              onSelect={() => onSelect({ folder: folder.name, subfolder: s.name })}
              onDeleteSubfolder={onDeleteSubfolder && (() => onDeleteSubfolder(folder.name, s.name))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Ensemble des dossiers repliés, persisté en localStorage (absent = tout déplié par défaut). */
function useCollapsedFolders(storageKey: string) {
  const [collapsed, setCollapsed] = useLocalStorageState<string[]>(storageKey, []);
  const collapsedSet = new Set(collapsed ?? []);
  const isExpanded = (name: string) => !collapsedSet.has(name);
  const toggle = (name: string) => {
    const next = new Set(collapsedSet);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setCollapsed([...next]);
  };
  return { isExpanded, toggle };
}

/**
 * Arborescence générique de dossiers (2 niveaux fixes, jamais plus profond). Chaque dossier est
 * repliable individuellement (état persisté en localStorage) ; déplié par défaut.
 *
 * Si `droppable`, sert aussi de zone de dépôt pour le glisser-déposer d'un élément : chaque
 * dossier/sous-dossier est une zone `useDroppable` distincte, et le `<nav>` lui-même est la zone de
 * repli (dépôt hors d'un dossier/sous-dossier précis -> dossier/sous-dossier par défaut). Replier un
 * dossier démonte ses zones de dépôt de sous-dossiers ; y déposer un élément le range alors dans son
 * sous-dossier par défaut, comme un dépôt sur un dossier sans sous-dossier visé.
 */
export function FolderNav({
  folders,
  isLoading = false,
  filter,
  onSelect,
  allLabel,
  ariaLabel,
  collapsedStorageKey,
  onDeleteFolder,
  onDeleteSubfolder,
  droppable = true,
}: FolderNavProps) {
  const defaultTarget: DropTarget = { kind: "default" };
  const { setNodeRef: setNavRef } = useDroppable({
    id: "folder-nav-default",
    data: defaultTarget,
    disabled: !droppable,
  });
  const { isExpanded, toggle } = useCollapsedFolders(collapsedStorageKey);

  return (
    <nav ref={setNavRef} aria-label={ariaLabel} className="space-y-0.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          filter === null ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {allLabel}
      </button>

      {isLoading && <p className="px-3 py-2 text-xs text-gray-400">Chargement…</p>}

      {folders.map((f) => (
        <FolderRow
          key={f.name}
          isExpanded={isExpanded(f.name)}
          onToggle={() => toggle(f.name)}
          folder={f}
          droppable={droppable}
          isActive={filter?.folder === f.name && !filter.subfolder}
          filter={filter}
          onSelect={onSelect}
          onDeleteFolder={onDeleteFolder}
          onDeleteSubfolder={onDeleteSubfolder}
        />
      ))}
    </nav>
  );
}

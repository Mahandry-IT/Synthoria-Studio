import Link from "next/link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import { Badge } from "@/components/Badge";
import { markdownToPlain } from "@/shared/utils/markdown";
import { DEFAULT_FOLDER, DEFAULT_SUBFOLDER } from "../history.constants";
import type { CourseHistoryItem } from "../history.types";

interface HistoryItemProps {
  item: CourseHistoryItem;
  onDeleteClick: (id: string) => void;
  onMoveClick: (item: CourseHistoryItem) => void;
  /** Affiche le badge de dossier — utile en vue « Tous les cours », redondant dans un dossier déjà filtré. */
  showFolder?: boolean;
}

function folderLabel(item: CourseHistoryItem): string {
  if (item.folder === DEFAULT_FOLDER && item.subfolder === DEFAULT_SUBFOLDER) return DEFAULT_FOLDER;
  return item.subfolder === DEFAULT_SUBFOLDER ? item.folder : `${item.folder} / ${item.subfolder}`;
}

/**
 * Ligne d'historique : question tronquée, badge mode, heure exacte, boutons déplacer/supprimer.
 * Le lien et les boutons sont des éléments cliquables distincts (jamais un bouton dans un lien).
 */
export function HistoryItem({ item, onDeleteClick, onMoveClick, showFolder = false }: HistoryItemProps) {
  const time = new Date(item.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50">
      <Link href={`/history/${item.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="flex-1 truncate">
          <span className="text-gray-900">{markdownToPlain(item.question)}</span>
          <span className="ml-2 text-xs text-gray-400">{time}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showFolder && <Badge variant="gray">{folderLabel(item)}</Badge>}
          <Badge variant={item.mode === "file_question" ? "indigo" : "green"}>
            {item.mode === "file_question" ? "📄" : "🔍"}
          </Badge>
        </div>
      </Link>
      <button
        type="button"
        aria-label="Déplacer vers un dossier"
        title="Déplacer vers un dossier"
        onClick={() => onMoveClick(item)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <DriveFileMoveOutlinedIcon fontSize="small" />
      </button>
      <button
        type="button"
        aria-label="Supprimer ce cours"
        title="Supprimer ce cours"
        onClick={() => onDeleteClick(item.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <DeleteOutlineIcon fontSize="small" />
      </button>
    </div>
  );
}

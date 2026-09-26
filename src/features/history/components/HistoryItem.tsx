import Link from "next/link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { Badge } from "@/components/Badge";
import { markdownToPlain } from "@/shared/utils/markdown";
import type { CourseHistoryItem } from "../history.types";

interface HistoryItemProps {
  item: CourseHistoryItem;
  onDeleteClick: (id: string) => void;
}

/**
 * Ligne d'historique : question tronquée, badge mode, heure exacte, bouton de suppression.
 * Le lien et le bouton sont deux éléments cliquables distincts (jamais un bouton dans un lien).
 */
export function HistoryItem({ item, onDeleteClick }: HistoryItemProps) {
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
        <Badge variant={item.mode === "file_question" ? "indigo" : "green"}>
          {item.mode === "file_question" ? "📄" : "🔍"}
        </Badge>
      </Link>
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

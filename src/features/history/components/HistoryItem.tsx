import Link from "next/link";
import { Badge } from "@/components/Badge";
import { markdownToPlain } from "@/shared/utils/markdown";
import type { CourseHistoryItem } from "../history.types";

interface HistoryItemProps {
  item: CourseHistoryItem;
}

/**
 * Ligne d'historique : question tronquée, badge mode, heure exacte.
 */
export function HistoryItem({ item }: HistoryItemProps) {
  const time = new Date(item.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/history/${item.id}`}
      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
    >
      <div className="flex-1 truncate">
        <span className="text-gray-900">{markdownToPlain(item.question)}</span>
        <span className="ml-2 text-xs text-gray-400">{time}</span>
      </div>
      <Badge variant={item.mode === "file_question" ? "indigo" : "green"}>
        {item.mode === "file_question" ? "📄" : "🔍"}
      </Badge>
    </Link>
  );
}

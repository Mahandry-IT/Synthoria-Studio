import { HistoryItem } from "./HistoryItem";
import { groupHistoryByDateAndHour } from "../history.utils";
import type { CourseHistoryItem } from "../history.types";

interface HistoryTimelineProps {
  items: CourseHistoryItem[];
  onDeleteClick: (id: string) => void;
  onMoveClick: (item: CourseHistoryItem) => void;
  /** Affiche le badge de dossier sur chaque ligne — vue « Tous les cours » (pas de filtre actif). */
  showFolder?: boolean;
}

/**
 * Timeline regroupée par date puis par tranche horaire.
 * Chaque groupe de date est enroulé par défaut (<details>).
 */
export function HistoryTimeline({ items, onDeleteClick, onMoveClick, showFolder = false }: HistoryTimelineProps) {
  const groups = groupHistoryByDateAndHour(items);

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <details key={group.date} className="group rounded-lg border border-gray-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 select-none hover:bg-gray-50 rounded-lg transition-colors">
            <span>{group.date}</span>
            <svg
              className="h-4 w-4 text-gray-400 transition-transform duration-200 group-open:rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </summary>
          <div className="border-t border-gray-100 px-4 pb-3 pt-2">
            {group.buckets.map((bucket) => (
              <div key={bucket.label} className="mb-3 last:mb-0 ml-2">
                <h4 className="mb-1.5 text-xs font-medium text-gray-400">
                  {bucket.label}
                </h4>
                <div className="space-y-0.5">
                  {bucket.items.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onDeleteClick={onDeleteClick}
                      onMoveClick={onMoveClick}
                      showFolder={showFolder}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

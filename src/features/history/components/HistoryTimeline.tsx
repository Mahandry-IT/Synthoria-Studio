import { HistoryItem } from "./HistoryItem";
import { groupHistoryByDateAndHour } from "../history.utils";
import type { CourseHistoryItem } from "../history.types";

interface HistoryTimelineProps {
  items: CourseHistoryItem[];
}

/**
 * Timeline regroupée par date puis par tranche horaire.
 */
export function HistoryTimeline({ items }: HistoryTimelineProps) {
  const groups = groupHistoryByDateAndHour(items);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <h3 className="mb-3 text-sm font-semibold text-gray-500">
            {group.date}
          </h3>
          {group.buckets.map((bucket) => (
            <div key={bucket.label} className="mb-4 ml-4">
              <h4 className="mb-2 text-xs font-medium text-gray-400">
                {bucket.label}
              </h4>
              <div className="space-y-1">
                {bucket.items.map((item) => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

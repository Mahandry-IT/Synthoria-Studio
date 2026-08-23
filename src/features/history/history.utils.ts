import type { CourseHistoryItem } from "./history.types";

/**
 * Formate une date ISO en "DD/MM/YYYY".
 */
export function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Retourne le label de tranche horaire (1h) pour une date ISO.
 * Ex: "9h - 10h"
 */
export function getHourBucketLabel(iso: string): string {
  const hour = new Date(iso).getHours();
  return `${hour}h - ${hour + 1}h`;
}

interface HourBucket {
  label: string;
  items: CourseHistoryItem[];
}

interface DateGroup {
  date: string;
  buckets: HourBucket[];
}

/**
 * Regroupe les items par date (desc), puis par tranche horaire (desc).
 * Les items sont triés par created_at desc dans chaque bucket.
 */
export function groupHistoryByDateAndHour(
  items: CourseHistoryItem[],
): DateGroup[] {
  const dateMap = new Map<string, Map<number, CourseHistoryItem[]>>();

  // Tri par created_at desc
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  for (const item of sorted) {
    const d = new Date(item.created_at);
    const dateKey = d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const hourBucket = d.getHours();

    if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
    const buckets = dateMap.get(dateKey)!;
    if (!buckets.has(hourBucket)) buckets.set(hourBucket, []);
    buckets.get(hourBucket)!.push(item);
  }

  const groups: DateGroup[] = [];
  for (const [date, buckets] of dateMap) {
    const sortedBuckets: HourBucket[] = [];
    const sortedHours = [...buckets.keys()].sort((a, b) => b - a);
    for (const hour of sortedHours) {
      sortedBuckets.push({
        label: `${hour}h - ${hour + 1}h`,
        items: buckets.get(hour)!,
      });
    }
    groups.push({ date, buckets: sortedBuckets });
  }

  return groups;
}

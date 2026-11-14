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

/** Date et heure d'un cours : "DD/MM/YYYY · HH:MM". */
export function formatHistoryDateTime(iso: string): string {
  const time = new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${formatHistoryDate(iso)} · ${time}`;
}

/** Les cours du plus récent au plus ancien (copie : `items` n'est pas modifié). */
export function sortHistoryByDate(items: CourseHistoryItem[]): CourseHistoryItem[] {
  return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Libellé du type de cours : sur documents (mode 2) ou recherche web (mode 3). */
export function historyModeLabel(mode: CourseHistoryItem["mode"]): string {
  return mode === "file_question" ? "Sur documents" : "Recherche web";
}

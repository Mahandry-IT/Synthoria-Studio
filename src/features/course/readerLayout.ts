/** Logique pure de la navigation du lecteur (fil des chapitres, colonne latérale) : testable sans DOM. */
import type { SectionStatus } from "./sectionProgress";

/** Aspect d'un chapitre dans le fil : fait, courant (déployé) ou à faire. */
export type ChapterView = "done" | "current" | "todo";

/** Le chapitre courant l'emporte sur son état de progression ; `in_progress` non courant reste « à faire ». */
export function chapterView(status: SectionStatus, isCurrent: boolean): ChapterView {
  if (isCurrent) return "current";
  return status === "done" ? "done" : "todo";
}

/** Chapitre commencé mais pas courant : reçoit un repère discret (le sens passe aussi par le texte masqué). */
export function isChapterStarted(status: SectionStatus, isCurrent: boolean): boolean {
  return status === "in_progress" && !isCurrent;
}

/** Numéro d'affichage à deux chiffres : 3 → « 03 ». */
export function chapterNumber(index: number): string {
  return String(Math.max(0, Math.floor(index)) + 1).padStart(2, "0");
}

/** « sur 12 sections » / « sur 1 section ». */
export function sectionCountLabel(total: number): string {
  const count = Math.max(0, Math.floor(total));
  return `sur ${count} section${count > 1 ? "s" : ""}`;
}

/** Tolérance (px) sur les bords du fil : le défilement fractionnaire ne doit pas laisser un bouton actif. */
const EDGE_TOLERANCE = 2;

export interface ScrollEdges {
  /** Du contenu reste à gauche (bouton « précédentes » actif). */
  canScrollBack: boolean;
  /** Du contenu reste à droite (bouton « suivantes » actif, masque de fin affiché). */
  canScrollForward: boolean;
}

export function scrollEdges(scrollLeft: number, scrollWidth: number, clientWidth: number): ScrollEdges {
  return {
    canScrollBack: scrollLeft > EDGE_TOLERANCE,
    canScrollForward: scrollLeft + clientWidth < scrollWidth - EDGE_TOLERANCE,
  };
}

/** Part de la largeur visible parcourue à chaque clic sur un chevron : le dernier élément vu reste visible. */
const SCROLL_STEP_RATIO = 0.8;

/** Position cible du défilement pour un clic sur un chevron, bornée au contenu. */
export function scrollTargetFor(direction: -1 | 1, scrollLeft: number, scrollWidth: number, clientWidth: number): number {
  const max = Math.max(0, scrollWidth - clientWidth);
  return Math.min(max, Math.max(0, scrollLeft + direction * clientWidth * SCROLL_STEP_RATIO));
}

/** Position qui centre un élément dans le fil, bornée au contenu. */
export function centerScrollTarget(itemLeft: number, itemWidth: number, scrollWidth: number, clientWidth: number): number {
  const max = Math.max(0, scrollWidth - clientWidth);
  return Math.min(max, Math.max(0, itemLeft - (clientWidth - itemWidth) / 2));
}

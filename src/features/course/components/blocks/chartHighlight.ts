import type { CourseChartStep } from "../../course.types";

/** Opacité des éléments non mis en avant pendant une étape. */
export const DIMMED_OPACITY = 0.25;

/** Vrai si l'étape met en avant au moins un label ou une série. */
export function hasHighlight(step: CourseChartStep | undefined): boolean {
  return !!step && (step.highlight_labels.length > 0 || step.highlight_series.length > 0);
}

/**
 * Un élément est mis en avant si son label OU sa série est listé. Sans étape, ou si l'étape ne met
 * rien en avant, tout reste normal (renvoie true). Utiliser -1 pour un indice sans objet (secteur : série).
 */
export function isHighlighted(step: CourseChartStep | undefined, labelIndex: number, seriesIndex: number): boolean {
  if (!step || !hasHighlight(step)) return true;
  return step.highlight_labels.includes(labelIndex) || step.highlight_series.includes(seriesIndex);
}

import type { SectionCycle } from "./course.types";

/**
 * Durée estimée d'une section : « ~5 min » si les deux bornes sont égales, « 4–6 min » sinon ;
 * null sans cycle ou sans durée (anciennes sections). Pas de compte à rebours.
 */
export function cycleDurationLabel(section: { cycle?: SectionCycle }): string | null {
  const cycle = section.cycle;
  if (!cycle || cycle.minutes_min == null || cycle.minutes_max == null) return null;
  const { minutes_min: min, minutes_max: max } = cycle;
  return min === max ? `~${min} min` : `${min}–${max} min`;
}

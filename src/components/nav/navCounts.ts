import type { PendingPlanItem } from "@/features/course/course.types";
import { activePlans } from "@/features/dashboard/dashboard.logic";
import type { NavCountKey } from "./navConfig";

/** Compteurs connus ; une clé absente = pas encore chargé ou en erreur (aucun faux zéro). */
export type NavCounts = Partial<Record<NavCountKey, number>>;

interface NavCountsInput {
  filesTotal?: number;
  coursesTotal?: number;
  totalDue?: number;
  /** `undefined` tant que la requête n'a pas répondu. */
  plans?: PendingPlanItem[];
  now: number;
}

const MAX_DISPLAYED = 99;

export function buildNavCounts({ filesTotal, coursesTotal, totalDue, plans, now }: NavCountsInput): NavCounts {
  const counts: NavCounts = {};
  if (filesTotal !== undefined) counts.files = filesTotal;
  if (coursesTotal !== undefined) counts.courses = coursesTotal;
  if (totalDue !== undefined) counts.reviews = totalDue;
  if (plans !== undefined) counts.plans = activePlans(plans, now).length;
  return counts;
}

/** Libellé d'un compteur : vide si inconnu, « 99+ » au-delà de 99. */
export function formatNavCount(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value) || value < 0) return "";
  return value > MAX_DISPLAYED ? `${MAX_DISPLAYED}+` : String(value);
}

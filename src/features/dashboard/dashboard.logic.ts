import type { PendingPlanItem } from "@/features/course/course.types";
import { formatHistoryDate } from "@/features/history/history.utils";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Nombre de podcasts affichés dans la carte du dashboard. */
export const RECENT_PODCASTS_COUNT = 3;

/** Les `count` éléments les plus récents (par `created_at`), du plus récent au plus ancien. */
export function pickRecent<T extends { created_at: string }>(items: T[], count: number = RECENT_PODCASTS_COUNT): T[] {
  return [...items]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, Math.max(0, count));
}

/** Plans encore reprenables à l'instant `now` (non expirés), du plus récent au plus ancien. */
export function activePlans(plans: PendingPlanItem[], now: number): PendingPlanItem[] {
  return plans
    .filter((plan) => new Date(plan.expires_at).getTime() > now)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Temps restant avant expiration, lisible : « 1 h 05 », « 12 min », « moins d'1 min », « Expiré ». */
export function formatCountdown(expiresAt: string, now: number): string {
  const remaining = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "Expiré";
  if (remaining < MINUTE_MS) return "moins d'1 min";

  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);

  if (days > 0) return `${days} j ${hours} h`;
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")}`;
  return `${minutes} min`;
}

/** Vrai si l'expiration est proche (moins de 15 min) : le compte à rebours passe en alerte. */
export function isExpiringSoon(expiresAt: string, now: number): boolean {
  const remaining = new Date(expiresAt).getTime() - now;
  return remaining > 0 && remaining < 15 * MINUTE_MS;
}

/** Date relative (« à l'instant », « il y a 5 min », « il y a 3 h », « hier »), sinon JJ/MM/AAAA. */
export function formatRelativeDate(iso: string, now: number): string {
  const elapsed = now - new Date(iso).getTime();
  if (!Number.isFinite(elapsed)) return "";
  if (elapsed < MINUTE_MS) return "à l'instant";
  if (elapsed < HOUR_MS) return `il y a ${Math.floor(elapsed / MINUTE_MS)} min`;
  if (elapsed < DAY_MS) return `il y a ${Math.floor(elapsed / HOUR_MS)} h`;
  if (elapsed < 2 * DAY_MS) return "hier";
  return formatHistoryDate(iso);
}

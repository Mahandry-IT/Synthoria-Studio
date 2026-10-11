/**
 * Convertit un en-tête `Retry-After` en secondes d'attente (arrondi supérieur, ≥ 0).
 * Accepte un nombre de secondes ou une date HTTP ; `undefined` si absent ou illisible.
 */
export function parseRetryAfter(value: unknown, now: number = Date.now()): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;

  if (/^\d+(\.\d+)?$/.test(raw)) return Math.ceil(Number(raw));
  // Une date HTTP commence par le jour de la semaine (« Wed, 21 Oct… ») : pas par un chiffre ou un signe.
  if (!/^[A-Za-z]/.test(raw)) return undefined;

  const date = Date.parse(raw);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - now) / 1000));
}

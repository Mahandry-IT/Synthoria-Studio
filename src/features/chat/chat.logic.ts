import type { ChatHistoryResponse, ChatMessage, ChatQuota, ChatSendResponse } from "./chat.types";

export interface ChatDayGroup {
  /** Jour local au format `AAAA-MM-JJ` (clé stable, triable). */
  key: string;
  /** Messages du jour, en ordre chronologique croissant. */
  messages: ChatMessage[];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Clé `AAAA-MM-JJ` du jour local d'une date. */
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeOf(message: ChatMessage): number {
  const t = new Date(message.created_at).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Regroupe les messages par jour local : jours du plus récent au plus ancien,
 * messages en ordre chronologique dans chaque jour (lecture naturelle d'une conversation).
 */
export function groupMessagesByDay(messages: ChatMessage[]): ChatDayGroup[] {
  const sorted = [...messages].sort((a, b) => timeOf(a) - timeOf(b));
  const byDay = new Map<string, ChatMessage[]>();

  for (const message of sorted) {
    const key = localDayKey(new Date(timeOf(message)));
    const day = byDay.get(key);
    if (day) day.push(message);
    else byDay.set(key, [message]);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([key, dayMessages]) => ({ key, messages: dayMessages }));
}

/** Libellé d'un jour : « Aujourd'hui », « Hier », sinon la date longue en français. */
export function dayLabel(key: string, now: Date = new Date()): string {
  if (key === localDayKey(now)) return "Aujourd'hui";
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (key === localDayKey(yesterday)) return "Hier";

  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Le quota du jour est-il épuisé ? */
export function isQuotaExhausted(quota: ChatQuota | null | undefined): boolean {
  return quota != null && quota.remaining <= 0;
}

/** « N messages restants aujourd'hui » (accord au singulier). */
export function remainingLabel(remaining: number): string {
  const n = Math.max(0, remaining);
  return n <= 1 ? `${n} message restant aujourd'hui` : `${n} messages restants aujourd'hui`;
}

/** Ajoute un échange à l'historique en cache et remplace le quota par celui renvoyé par le serveur. */
export function appendExchange(
  history: ChatHistoryResponse | undefined,
  exchange: ChatSendResponse,
): ChatHistoryResponse {
  const known = new Set((history?.messages ?? []).map((m) => m.id));
  const added = [exchange.user_message, exchange.assistant_message].filter((m) => !known.has(m.id));
  return { messages: [...(history?.messages ?? []), ...added], quota: exchange.quota };
}

/** N'autorise un lien cliquable que pour une URL http(s) (pas de `javascript:` ni `data:`). */
export function toSafeHttpUrl(reference: string): string | null {
  try {
    const url = new URL(reference);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

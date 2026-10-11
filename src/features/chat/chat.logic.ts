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

/* ------------------------------------------------------------------------------------------------
 * Arbre des versions : chaque message pointe vers son parent (`parent_id`). Les questions de même
 * parent sont des versions sœurs ; le fil affiché suit, à chaque niveau, la version sélectionnée.
 * --------------------------------------------------------------------------------------------- */

/** Clé de parent des messages racines (`parent_id: null`). */
export const ROOT_KEY = "root";

/** Version choisie à chaque niveau : clé de parent → id du message enfant affiché. */
export type ChatSelection = Readonly<Record<string, string>>;

export interface ChatVersionInfo {
  /** Clé de parent partagée par les versions sœurs (clé de la sélection). */
  parentKey: string;
  /** Position de la version affichée, à partir de 1 (ordre chronologique des versions). */
  index: number;
  count: number;
  previousId: string | null;
  nextId: string | null;
}

export interface ChatThreadEntry {
  message: ChatMessage;
  /** Versions sœurs d'une question ; `null` pour une réponse du tuteur. */
  versions: ChatVersionInfo | null;
}

function byTime(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => timeOf(a) - timeOf(b));
}

/**
 * Clé de parent effective de chaque message. Historique antérieur aux versions (aucun `parent_id`) :
 * les messages forment une chaîne dans l'ordre chronologique.
 */
function parentKeys(messages: ChatMessage[]): Map<string, string> {
  const legacy = messages.length > 1 && messages.every((m) => m.parent_id == null);
  const sorted = byTime(messages);
  return new Map(
    sorted.map((m, i) => [m.id, legacy ? (sorted[i - 1]?.id ?? ROOT_KEY) : (m.parent_id ?? ROOT_KEY)]),
  );
}

/** Enfants de chaque clé de parent, du plus ancien au plus récent. */
function childrenByParent(messages: ChatMessage[]): Map<string, ChatMessage[]> {
  const parents = parentKeys(messages);
  const children = new Map<string, ChatMessage[]>();
  for (const message of byTime(messages)) {
    const key = parents.get(message.id) ?? ROOT_KEY;
    const siblings = children.get(key);
    if (siblings) siblings.push(message);
    else children.set(key, [message]);
  }
  return children;
}

function versionInfo(parentKey: string, versions: ChatMessage[], index: number): ChatVersionInfo {
  return {
    parentKey,
    index: index + 1,
    count: versions.length,
    previousId: versions[index - 1]?.id ?? null,
    nextId: versions[index + 1]?.id ?? null,
  };
}

/**
 * Fil affiché : depuis la racine, à chaque niveau, l'enfant sélectionné ou à défaut le plus récent.
 * Une sélection obsolète (message supprimé) retombe sur la version la plus récente.
 */
export function resolveThread(messages: ChatMessage[], selection: ChatSelection = {}): ChatThreadEntry[] {
  const children = childrenByParent(messages);
  const thread: ChatThreadEntry[] = [];
  const visited = new Set<string>();
  let key = ROOT_KEY;

  for (;;) {
    const siblings = children.get(key) ?? [];
    if (siblings.length === 0) break;
    const selected = siblings.findIndex((m) => m.id === selection[key]);
    const message = siblings[selected >= 0 ? selected : siblings.length - 1];
    if (visited.has(message.id)) break; // garde-fou contre un cycle dans des données corrompues
    visited.add(message.id);

    const versions = siblings.filter((m) => m.role === message.role);
    thread.push({
      message,
      versions: message.role === "user" ? versionInfo(key, versions, versions.indexOf(message)) : null,
    });
    key = message.id;
  }
  return thread;
}

/** Parent d'une nouvelle question : la dernière réponse du fil affiché (`null` si fil vide). */
export function lastAssistantId(thread: ChatThreadEntry[]): string | null {
  for (let i = thread.length - 1; i >= 0; i--) {
    if (thread[i].message.role === "assistant") return thread[i].message.id;
  }
  return null;
}

/** Question à renvoyer pour « Réessayer » une réponse du tuteur. */
export interface ChatRetryRequest {
  /** Question à l'origine de la réponse (coupée du fil pendant l'envoi). */
  questionId: string;
  message: string;
  /** Parent de la question : la nouvelle version en sera la sœur (`null` : racine). */
  parentId: string | null;
}

/**
 * « Réessayer » une réponse : même texte que la question qui la précède dans le fil, envoyé avec le
 * même parent pour créer une version sœur navigable. `null` si la réponse n'est pas précédée d'une question.
 */
export function retryRequestFor(thread: ChatThreadEntry[], assistantId: string): ChatRetryRequest | null {
  const index = thread.findIndex((entry) => entry.message.id === assistantId);
  const question = index > 0 ? thread[index - 1] : undefined;
  if (thread[index]?.message.role !== "assistant" || question?.message.role !== "user") return null;

  const parentKey = question.versions?.parentKey ?? ROOT_KEY;
  return {
    questionId: question.message.id,
    message: question.message.content,
    parentId: parentKey === ROOT_KEY ? null : parentKey,
  };
}

/** Affiche ce message à son niveau (navigation entre versions, nouvelle version après édition). */
export function selectMessage(selection: ChatSelection, message: ChatMessage): ChatSelection {
  return { ...selection, [message.parent_id ?? ROOT_KEY]: message.id };
}

/**
 * Sélection après suppression d'une question : la version voisine (précédente, sinon suivante)
 * prend sa place ; s'il n'en reste aucune, la branche disparaît du fil.
 * `messages` est l'historique avant suppression.
 */
export function selectionAfterDelete(
  messages: ChatMessage[],
  selection: ChatSelection,
  deletedId: string,
): ChatSelection {
  const deleted = messages.find((m) => m.id === deletedId);
  if (!deleted) return selection;

  const key = parentKeys(messages).get(deletedId) ?? ROOT_KEY;
  const versions = (childrenByParent(messages).get(key) ?? []).filter((m) => m.role === deleted.role);
  const index = versions.findIndex((m) => m.id === deletedId);
  const remaining = versions.filter((m) => m.id !== deletedId);

  const next: Record<string, string> = { ...selection };
  delete next[key];
  if (remaining.length > 0) next[key] = remaining[Math.max(0, index - 1)].id;
  return next;
}

/** Retire un message, sa réponse et toute sa descendance de l'historique en cache. */
export function removeMessageBranch(history: ChatHistoryResponse, messageId: string): ChatHistoryResponse {
  const children = childrenByParent(history.messages);
  const removed = new Set<string>();
  const stack = [messageId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (removed.has(id)) continue;
    removed.add(id);
    for (const child of children.get(id) ?? []) stack.push(child.id);
  }
  return { ...history, messages: history.messages.filter((m) => !removed.has(m.id)) };
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

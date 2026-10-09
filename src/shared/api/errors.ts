import {
  ERROR_MESSAGES,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from "./errorMessages";
import { HttpError } from "./httpClient";

/** Messages par statut propres à un contexte (ex. plan : 404 → « Plan introuvable »). */
export type StatusMessages = Readonly<Partial<Record<number, string>>>;

export type ErrorKind = "http" | "network" | "timeout" | "unknown";

/** Vue normalisée d'une erreur, pour l'affichage (toast) et le diagnostic. */
export interface ErrorInfo {
  kind: ErrorKind;
  message: string;
  status?: number;
  method?: string;
  url?: string;
  /** Code stable du backend (`rate_limited`, `gemini_quota`, `not_found`…). */
  errorCode?: string;
  requestId?: string;
  /** Détail technique renvoyé par le backend en développement uniquement. */
  debug?: unknown;
  retryAfterSeconds?: number;
}

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

function bodyField(body: unknown, key: string): unknown {
  return body && typeof body === "object" ? (body as Record<string, unknown>)[key] : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** `detail` lisible du backend ; défend contre un `detail` doublement encodé en JSON. */
function readDetail(body: unknown): string | undefined {
  const detail = asString(bodyField(body, "detail"));
  if (!detail) return undefined;
  try {
    const nested = asString(bodyField(JSON.parse(detail), "detail"));
    if (nested) return nested;
  } catch {
    // Pas du JSON imbriqué : on garde la valeur telle quelle.
  }
  return detail;
}

function httpKind(err: HttpError): ErrorKind {
  if (err.status === 0) return err.meta.code && TIMEOUT_CODES.has(err.meta.code) ? "timeout" : "network";
  return "http";
}

function httpMessage(err: HttpError, kind: ErrorKind, messages: StatusMessages): string {
  if (kind === "network") return NETWORK_ERROR_MESSAGE;
  if (kind === "timeout") return TIMEOUT_ERROR_MESSAGE;
  return readDetail(err.body) ?? messages[err.status] ?? ERROR_MESSAGES[err.status] ?? `Erreur ${err.status}.`;
}

/**
 * Normalise une erreur quelconque.
 * Message : `detail` du backend → message du contexte (`messages`) → message générique par statut
 * → message selon le type (réseau, délai dépassé) → `error.message`.
 */
export function describeError(err: unknown, messages: StatusMessages = {}): ErrorInfo {
  if (err instanceof HttpError) {
    const kind = httpKind(err);
    return {
      kind,
      message: httpMessage(err, kind, messages),
      status: err.status || undefined,
      method: err.meta.method,
      url: err.meta.url,
      errorCode: asString(bodyField(err.body, "error_code")),
      requestId: asString(bodyField(err.body, "request_id")) ?? err.meta.requestId,
      debug: bodyField(err.body, "debug"),
      retryAfterSeconds: err.meta.retryAfterSeconds,
    };
  }
  if (err instanceof Error) return { kind: "unknown", message: err.message || UNKNOWN_ERROR_MESSAGE };
  if (typeof err === "string" && err.trim()) return { kind: "unknown", message: err };
  return { kind: "unknown", message: UNKNOWN_ERROR_MESSAGE };
}

/** Message lisible d'une erreur (voir `describeError`). */
export function resolveErrorMessage(err: unknown, messages?: StatusMessages): string {
  return describeError(err, messages).message;
}

/**
 * Clé de déduplication d'un toast : deux erreurs identiques (même code, statut et requête)
 * ne s'empilent pas, ce qui évite la rafale due au polling.
 */
export function errorToastId(info: ErrorInfo): string {
  if (info.kind === "unknown") return `error:${info.message}`;
  return `error:${info.errorCode ?? info.kind}:${info.status ?? 0}:${info.method ?? ""} ${info.url ?? ""}`;
}

/** Identifiant court affiché en production pour retrouver l'erreur dans les logs. */
export function shortRequestId(requestId: string | undefined): string | undefined {
  return requestId ? requestId.replace(/-/g, "").slice(0, 8) : undefined;
}

/** Texte des détails techniques (copié par le bouton « Copier les détails »). */
export function formatErrorDetails(info: ErrorInfo, occurredAt: Date): string {
  const lines = [
    `Message : ${info.message}`,
    `Statut : ${info.status ?? "—"}`,
    `Requête : ${[info.method, info.url].filter(Boolean).join(" ") || "—"}`,
    `error_code : ${info.errorCode ?? "—"}`,
    `request_id : ${info.requestId ?? "—"}`,
    `Date : ${occurredAt.toISOString()}`,
  ];
  if (info.debug !== undefined) lines.push(`debug : ${JSON.stringify(info.debug, null, 2)}`);
  return lines.join("\n");
}

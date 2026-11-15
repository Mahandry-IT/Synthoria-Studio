import http from "node:http";
import https from "node:https";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const RELAYED_ERROR_HEADERS = ["retry-after", "x-request-id"] as const;

interface ProxyPostOptions {
  /** Route backend (ex. "/courses/plan") */
  backendPath: string;
  timeoutMs: number;
  timeoutMessage: string;
}

interface BackendResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  text: string;
}

/**
 * POST JSON via `node:http(s)` : contrairement au `fetch` natif (undici), qui coupe avec
 * `UND_ERR_HEADERS_TIMEOUT` si le backend n'envoie pas ses en-têtes en 5 minutes, la génération d'un
 * cours long n'a ici d'autre limite que `signal` (le délai demandé par la route).
 */
function postJson(url: string, body: unknown, signal: AbortSignal): Promise<BackendResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;
    const payload = JSON.stringify(body);
    const req = client.request(
      target,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
        signal,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 502, headers: res.headers, text: Buffer.concat(chunks).toString("utf-8") }),
        );
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end(payload);
  });
}

/**
 * Proxy POST vers le backend avec un timeout étendu.
 * Le rewrite proxy Next.js a un timeout trop court (~30s) pour les appels de
 * génération, qui prennent 30-120s+ (plus de 5 min pour un cours long). La requête est faite avec
 * `node:http` et `AbortSignal.timeout` (voir `postJson`).
 * Les erreurs backend sont relayées avec leur statut, leur corps (`detail`, `error_code`,
 * `request_id`, `debug`) et les en-têtes utiles au client (`Retry-After`, `X-Request-ID`).
 */
export async function proxyPost(
  request: NextRequest,
  { backendPath, timeoutMs, timeoutMessage }: ProxyPostOptions,
): Promise<NextResponse> {
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    const body = await request.json();

    const res = await postJson(`${API_URL}${backendPath}`, body, signal);

    if (res.status < 200 || res.status >= 300) return relayError(res);

    return NextResponse.json(JSON.parse(res.text));
  } catch (err) {
    if (signal.aborted) {
      return NextResponse.json({ detail: timeoutMessage }, { status: 504 });
    }

    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const cause = describeCause(err);
    const detail = `${message}${cause ? ` (${cause})` : ""}`;
    console.error(`[proxyPost] ${backendPath} : ${detail}`);
    return NextResponse.json({ detail: `Erreur proxy: ${detail}` }, { status: 502 });
  }
}

/**
 * Cause réelle d'un échec réseau (`err.cause` ou code Node) : code et message, par exemple
 * `ECONNREFUSED` ou `ECONNRESET`. Chaîne vide s'il n'y en a pas.
 */
function describeCause(err: unknown): string {
  const source = err instanceof Error && err.cause instanceof Error ? err.cause : err;
  if (!(source instanceof Error)) return "";
  const code = (source as Error & { code?: unknown }).code;
  const parts = [typeof code === "string" ? code : "", source === err ? "" : source.message];
  return parts.filter(Boolean).join(" : ");
}

/** Relaie une réponse d'erreur du backend sans perdre son contrat (`{detail, error_code, request_id}`). */
function relayError(res: BackendResponse): NextResponse {
  let body: Record<string, unknown> = { detail: res.text };
  try {
    const parsed: unknown = JSON.parse(res.text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    // Corps non JSON (proxy, page d'erreur) : gardé comme `detail`.
  }

  const headers = new Headers();
  for (const name of RELAYED_ERROR_HEADERS) {
    const raw = res.headers[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) headers.set(name, value);
  }
  return NextResponse.json(body, { status: res.status, headers });
}

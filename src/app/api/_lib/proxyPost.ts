import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const RELAYED_ERROR_HEADERS = ["retry-after", "x-request-id"] as const;

interface ProxyPostOptions {
  /** Route backend (ex. "/courses/plan") */
  backendPath: string;
  timeoutMs: number;
  timeoutMessage: string;
}

/**
 * Proxy POST vers le backend avec un timeout étendu.
 * Le rewrite proxy Next.js a un timeout trop court (~30s) pour les appels de
 * génération, qui prennent 30-120s+. Utilise fetch natif avec `AbortSignal.timeout`.
 * Les erreurs backend sont relayées avec leur statut, leur corps (`detail`, `error_code`,
 * `request_id`, `debug`) et les en-têtes utiles au client (`Retry-After`, `X-Request-ID`).
 */
export async function proxyPost(
  request: NextRequest,
  { backendPath, timeoutMs, timeoutMessage }: ProxyPostOptions,
): Promise<NextResponse> {
  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}${backendPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) return await relayError(res);

    return NextResponse.json(await res.json());
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json({ detail: timeoutMessage }, { status: 504 });
    }

    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ detail: `Erreur proxy: ${message}` }, { status: 502 });
  }
}

/** Relaie une réponse d'erreur du backend sans perdre son contrat (`{detail, error_code, request_id}`). */
async function relayError(res: Response): Promise<NextResponse> {
  const errorText = await res.text();
  let body: Record<string, unknown> = { detail: errorText };
  try {
    const parsed: unknown = JSON.parse(errorText);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    // Corps non JSON (proxy, page d'erreur) : gardé comme `detail`.
  }

  const headers = new Headers();
  for (const name of RELAYED_ERROR_HEADERS) {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }
  return NextResponse.json(body, { status: res.status, headers });
}

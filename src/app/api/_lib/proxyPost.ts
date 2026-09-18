import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
 * Les erreurs backend sont relayées avec leur statut et leur `detail` FastAPI.
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

    if (!res.ok) {
      const errorText = await res.text();
      let detail: unknown = errorText;
      try {
        const parsed = JSON.parse(errorText);
        // FastAPI : `detail` est une chaîne (HTTPException) ou une liste (422)
        if (parsed.detail !== undefined) detail = parsed.detail;
      } catch {
        // errorText n'est pas du JSON, on le garde tel quel
      }
      return NextResponse.json({ detail }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json({ detail: timeoutMessage }, { status: 504 });
    }

    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ detail: `Erreur proxy: ${message}` }, { status: 502 });
  }
}

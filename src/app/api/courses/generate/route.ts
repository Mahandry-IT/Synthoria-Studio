import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const GENERATION_TIMEOUT_MS = 360_000;

/**
 * Proxy API route pour /courses/generate.
 * Le rewrite proxy Next.js a un timeout trop court (~30s) pour la génération
 * de cours qui prend 30-120s+. Cette route utilise fetch natif avec timeout étendu.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}/courses/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json(
        { detail: errorBody },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue";

    if (err instanceof DOMException && err.name === "TimeoutError") {
      return NextResponse.json(
        { detail: "La génération a pris trop de temps. Réessayez." },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { detail: `Erreur proxy: ${message}` },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";

/**
 * Sonde de vivacité du serveur Next (HEALTHCHECK Docker, compose parapluie).
 * Volontairement hors de `/api/*` : ce préfixe est réécrit vers le backend,
 * et `/api/health` doit continuer à refléter la santé de l'API.
 * N'appelle pas le backend : une API indisponible ne doit pas rendre le front
 * « unhealthy » et provoquer des redémarrages en cascade.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}

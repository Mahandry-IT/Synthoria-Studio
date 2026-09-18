import type { NextRequest } from "next/server";
import { proxyPost } from "../../_lib/proxyPost";

const PLAN_TIMEOUT_MS = 180_000;

/** Proxy API route pour /courses/plan (plan détaillé d'un cours, avant génération). */
export function POST(request: NextRequest) {
  return proxyPost(request, {
    backendPath: "/courses/plan",
    timeoutMs: PLAN_TIMEOUT_MS,
    timeoutMessage: "La génération du plan a pris trop de temps. Réessayez.",
  });
}

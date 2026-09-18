import type { NextRequest } from "next/server";
import { proxyPost } from "../../../_lib/proxyPost";

// Un cours long est généré par lots de sections : durée supérieure à la génération directe.
const GENERATION_TIMEOUT_MS = 600_000;

/** Proxy API route pour /courses/generate/from-plan (cours complet à partir d'un plan validé). */
export function POST(request: NextRequest) {
  return proxyPost(request, {
    backendPath: "/courses/generate/from-plan",
    timeoutMs: GENERATION_TIMEOUT_MS,
    timeoutMessage: "La génération du cours a pris trop de temps. Réessayez.",
  });
}

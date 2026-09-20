import type { NextRequest } from "next/server";
import { proxyPost } from "../../../_lib/proxyPost";

const REFINE_TIMEOUT_MS = 180_000;

/** Proxy API route pour /courses/plan/refine-section (complétion IA d'une section du plan). */
export function POST(request: NextRequest) {
  return proxyPost(request, {
    backendPath: "/courses/plan/refine-section",
    timeoutMs: REFINE_TIMEOUT_MS,
    timeoutMessage: "La complétion de la section a pris trop de temps. Réessayez.",
  });
}

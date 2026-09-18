import type { NextRequest } from "next/server";
import { proxyPost } from "../../_lib/proxyPost";

const GENERATION_TIMEOUT_MS = 360_000;

/** Proxy API route pour /courses/generate (génération directe, sans plan). */
export function POST(request: NextRequest) {
  return proxyPost(request, {
    backendPath: "/courses/generate",
    timeoutMs: GENERATION_TIMEOUT_MS,
    timeoutMessage: "La génération a pris trop de temps. Réessayez.",
  });
}

import type { NextRequest } from "next/server";
import { proxyPost } from "../../../_lib/proxyPost";

const MORE_SECTIONS_TIMEOUT_MS = 180_000;

/** Proxy API route pour /courses/plan/more-sections (nouvelles sections « pour aller plus loin »). */
export function POST(request: NextRequest) {
  return proxyPost(request, {
    backendPath: "/courses/plan/more-sections",
    timeoutMs: MORE_SECTIONS_TIMEOUT_MS,
    timeoutMessage: "La génération des sections a pris trop de temps. Réessayez.",
  });
}

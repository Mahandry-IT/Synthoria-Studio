"use client";

import { useEffect, useMemo, useState } from "react";
import { peaksFromSamples, waveformBars } from "../podcast.player";

/** Au-delà, on ne décode pas (mémoire) et on garde la pseudo-onde. */
export const MAX_DECODE_BYTES = 40 * 1024 * 1024;

/** Lit le corps de la réponse par morceaux ; abandonne (`null`) dès que `max` octets sont dépassés, même sans Content-Length. */
async function readLimited(response: Response, max: number): Promise<ArrayBuffer | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      void reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

/** Télécharge et décode l'audio pour en extraire les pics ; `null` si c'est impossible ou trop lourd. */
async function decodePeaks(url: string, count: number, signal: AbortSignal): Promise<number[] | null> {
  const AudioContextCtor: typeof AudioContext | undefined =
    typeof window === "undefined" ? undefined : (window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AudioContextCtor) return null;

  // Même origine que l'audio (URL relative), sans en-têtes ajoutés.
  const response = await fetch(url, { signal });
  const declared = Number(response.headers.get("content-length"));
  if (!response.ok || (Number.isFinite(declared) && declared > MAX_DECODE_BYTES)) return null;
  const buffer = await readLimited(response, MAX_DECODE_BYTES);
  if (!buffer || signal.aborted) return null;

  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(buffer);
    return signal.aborted ? null : peaksFromSamples(decoded.getChannelData(0), count);
  } finally {
    void context.close();
  }
}

/**
 * Hauteurs des barres de la forme d'onde : pseudo-onde déterministe (graine = `seed`) tout de suite,
 * remplacée par les vrais pics si le décodage réussit. Le décodage ne démarre qu'avec `enabled`
 * (premier appui sur lecture) pour conserver `preload="none"` ; la requête est annulée au démontage.
 */
export function usePodcastPeaks(seed: string, url: string, count: number, enabled: boolean): number[] {
  const fallback = useMemo(() => waveformBars(seed, count), [seed, count]);
  const [decoded, setDecoded] = useState<{ url: string; peaks: number[] } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    decodePeaks(url, count, controller.signal)
      .then((peaks) => {
        if (peaks && !controller.signal.aborted) setDecoded({ url, peaks });
      })
      .catch(() => {
        /* repli silencieux sur la pseudo-onde : le décodage est un confort, pas une fonction critique */
      });
    return () => controller.abort();
  }, [enabled, url, count]);

  return decoded?.url === url && decoded.peaks.length === count ? decoded.peaks : fallback;
}

"use client";

import { useEffect, useState } from "react";
import { highlightCode, type CodeToken } from "@/shared/utils/code/highlight";

/**
 * Jetons colorés du code, ou `null` tant que la coloration se charge (le code s'affiche
 * d'abord sans couleur, puis se colore) ou s'il n'y a pas de langage à colorer.
 *
 * @param code - code à colorer
 * @param label - étiquette du bloc (```cpp) ; sinon le langage est déduit du code
 */
export function useHighlightedCode(code: string, label: string | null): CodeToken[] | null {
  const key = JSON.stringify([label, code]);
  const [result, setResult] = useState<{ key: string; tokens: CodeToken[] | null }>();

  useEffect(() => {
    let cancelled = false;
    highlightCode(code, label).then((tokens) => {
      if (!cancelled) setResult({ key, tokens });
    });
    return () => {
      cancelled = true;
    };
  }, [key, code, label]);

  // Un résultat obsolète (code modifié entre-temps) n'est jamais affiché.
  return result?.key === key ? result.tokens : null;
}

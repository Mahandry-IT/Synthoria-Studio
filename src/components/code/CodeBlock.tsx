"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useHighlightedCode } from "@/shared/hooks/useHighlightedCode";
import { toastError } from "@/shared/ui/toast";
import { copyToClipboard } from "@/shared/utils/clipboard";
import type { CodeToken } from "@/shared/utils/code/highlight";

const COPIED_FEEDBACK_MS = 1_500;

function renderTokens(tokens: CodeToken[]): ReactNode {
  return tokens.map((token, i) =>
    typeof token === "string" ? (
      token
    ) : (
      <span key={i} className={token.className}>
        {renderTokens(token.children)}
      </span>
    ),
  );
}

interface CodeBlockProps {
  code: string;
  /** Langage affiché en légende (ex. `cpp`) et utilisé pour la coloration. */
  language?: string | null;
}

/**
 * Boîte de code en lecture seule (comme un bloc de code Notion) avec bouton « copier ».
 * En-tête (langage + copier) au-dessus du code, pour rester lisible sur petit écran.
 * Le code est affiché tel quel, sans retour à la ligne automatique : défilement horizontal.
 *
 * Éléments « phrasing » uniquement (span/code/button) : ce composant est rendu dans des
 * <p> et <li>, où un <div> ou <pre> serait invalide.
 */
export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tokens = useHighlightedCode(code, language ?? null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    if (!(await copyToClipboard(code))) {
      toastError(new Error("Impossible de copier le code."));
      return;
    }
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return (
    <span className="my-2 block rounded-lg border border-gray-200 bg-gray-100 font-normal not-italic">
      {/* En-tête : langage à gauche, bouton copier à droite (jamais superposés au code) */}
      <span className="flex items-center justify-between gap-2 px-3 pt-2">
        <span className="min-w-0 truncate text-xs font-medium text-gray-500">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Code copié" : "Copier le code"}
          className="-mr-1.5 flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          {copied ? (
            <>
              <CheckIcon sx={{ fontSize: 16 }} className="text-green-600" />
              Copié
            </>
          ) : (
            <>
              <ContentCopyIcon sx={{ fontSize: 16 }} />
              Copier
            </>
          )}
        </button>
      </span>
      <code
        tabIndex={0}
        className="code-highlight block overflow-x-auto whitespace-pre px-3 py-2.5 font-mono text-[13px] leading-relaxed text-gray-800 focus-visible:outline-2 focus-visible:outline-indigo-500"
      >
        {tokens ? renderTokens(tokens) : code}
      </code>
      <span role="status" className="sr-only">
        {copied ? "Code copié dans le presse-papiers" : ""}
      </span>
    </span>
  );
}

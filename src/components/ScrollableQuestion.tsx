"use client";

import { useEffect, useRef, useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { RichTextView } from "@/components/editor/RichTextView";
import { toastError } from "@/shared/ui/toast";
import { copyToClipboard } from "@/shared/utils/clipboard";

const COPIED_FEEDBACK_MS = 1_500;

interface ScrollableQuestionProps {
  /** Question en markdown brut (copiée telle quelle). */
  markdown: string;
}

/**
 * Question posée affichée dans un cadre de hauteur fixe : le contenu complet se lit en
 * faisant défiler le cadre, le texte reste sélectionnable et un bouton copie la question entière.
 */
export function ScrollableQuestion({ markdown }: ScrollableQuestionProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    if (!(await copyToClipboard(markdown))) {
      toastError(new Error("Impossible de copier la question."));
      return;
    }
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        <span className="text-xs font-medium text-gray-500">Question posée</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Question copiée" : "Copier la question"}
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
      </div>
      <div
        role="region"
        aria-label="Contenu de la question (défilable)"
        tabIndex={0}
        className="max-h-48 overflow-y-auto overscroll-contain px-3 pb-3 pt-1 focus-visible:outline-2 focus-visible:outline-indigo-500"
      >
        <RichTextView markdown={markdown} className="text-sm text-gray-700" />
      </div>
      <span role="status" className="sr-only">
        {copied ? "Question copiée dans le presse-papiers" : ""}
      </span>
    </div>
  );
}

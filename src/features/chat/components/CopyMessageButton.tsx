"use client";

import { useEffect, useRef, useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { toastError } from "@/shared/ui/toast";

const COPIED_FEEDBACK_MS = 2_000;

interface CopyMessageButtonProps {
  /** Markdown brut du message (copié tel quel, formules et code compris). */
  markdown: string;
  className: string;
}

/** Copie un message du chat : icône « Copié » pendant 2 s et annonce aux lecteurs d'écran. */
export function CopyMessageButton({ markdown, className }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    if (!(await copyToClipboard(markdown))) {
      toastError(new Error("Impossible de copier le message."));
      return;
    }
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={copied ? "Message copié" : "Copier le message"}
        title={copied ? "Copié" : "Copier"}
        onClick={handleCopy}
      >
        {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Message copié" : ""}
      </span>
    </>
  );
}

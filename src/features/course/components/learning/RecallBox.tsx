"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { RECALL_ANSWER_MAX_LENGTH } from "@/shared/utils/constants";
import type { RecallPrompt, RecallResponse } from "../../course.types";
import { useRecallFeedback } from "../../hooks/useRecallFeedback";
import { RichText } from "../RichText";

/** Le verdict est porté par le libellé ; la couleur (encadré + filet) ne fait que le souligner. */
const VERDICT_STYLES: Record<RecallResponse["verdict"], { box: string; head: string; label: string }> = {
  correct: { box: "border-ok bg-ok-soft", head: "text-ok", label: "Très bien !" },
  partiel: { box: "border-warn bg-warn-soft", head: "text-warn", label: "Presque — il manque quelques idées" },
  incorrect: { box: "border-err bg-err-soft", head: "text-err", label: "À revoir" },
};

interface RecallBoxProps {
  sessionId: string;
  sectionId: string;
  prompt: RecallPrompt;
  /** Le titre est déjà porté par l'étape du lecteur progressif. */
  hideTitle?: boolean;
}

/** « Explique avec tes mots » : l'apprenant reformule, l'IA évalue et indique les points manquants. */
export function RecallBox({ sessionId, sectionId, prompt, hideTitle = false }: RecallBoxProps) {
  const [answer, setAnswer] = useState("");
  const recall = useRecallFeedback();
  const result = recall.data;
  const style = result ? VERDICT_STYLES[result.verdict] : null;
  // Limite sur le Markdown (ce que le backend reçoit) : l'éditeur riche n'a pas de maxLength
  const isOverLimit = answer.length > RECALL_ANSWER_MAX_LENGTH;

  return (
    <div className="space-y-3 rounded-card border border-line bg-surface p-4 text-sm text-ink">
      {!hideTitle && (
        <p className="kicker font-semibold">Explique avec tes mots</p>
      )}
      <RichText text={prompt.prompt} className="font-medium text-ink" />
      <RichTextEditor
        ariaLabel="Votre explication"
        value={answer}
        onChange={setAnswer}
        minRows={4}
        invalid={isOverLimit}
      />
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs ${isOverLimit ? "font-medium text-err" : "text-ink-3"}`}>
          {answer.length}/{RECALL_ANSWER_MAX_LENGTH}
        </span>
        <Button
          type="button"
          size="sm"
          loading={recall.isPending}
          disabled={answer.trim().length === 0 || isOverLimit}
          onClick={() => recall.mutate({ sessionId, sectionId, answer })}
        >
          Évaluer mon explication
        </Button>
      </div>
      {result && style && (
        <div role="status" className={`rounded-card border-l-[3px] p-3 text-ink ${style.box}`}>
          <p className={`font-semibold ${style.head}`}>{style.label}</p>
          <p className="mt-1">{result.feedback}</p>
          {result.missing_points.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.missing_points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

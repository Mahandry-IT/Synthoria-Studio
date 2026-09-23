"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { RECALL_ANSWER_MAX_LENGTH } from "@/shared/utils/constants";
import type { RecallPrompt, RecallResponse } from "../../course.types";
import { useRecallFeedback } from "../../hooks/useRecallFeedback";
import { RichText } from "../RichText";

const VERDICT_STYLES: Record<RecallResponse["verdict"], { box: string; label: string }> = {
  correct: { box: "bg-green-50 text-green-900", label: "Très bien !" },
  partiel: { box: "bg-amber-50 text-amber-900", label: "Presque — il manque quelques idées" },
  incorrect: { box: "bg-red-50 text-red-900", label: "À revoir" },
};

interface RecallBoxProps {
  sessionId: string;
  sectionId: string;
  prompt: RecallPrompt;
}

/** « Explique avec tes mots » : l'apprenant reformule, l'IA évalue et indique les points manquants. */
export function RecallBox({ sessionId, sectionId, prompt }: RecallBoxProps) {
  const [answer, setAnswer] = useState("");
  const recall = useRecallFeedback();
  const result = recall.data;
  const style = result ? VERDICT_STYLES[result.verdict] : null;
  // Limite sur le Markdown (ce que le backend reçoit) : l'éditeur riche n'a pas de maxLength
  const isOverLimit = answer.length > RECALL_ANSWER_MAX_LENGTH;

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Explique avec tes mots</p>
      <RichText text={prompt.prompt} className="font-medium text-gray-900" />
      <RichTextEditor
        ariaLabel="Votre explication"
        value={answer}
        onChange={setAnswer}
        minRows={4}
        invalid={isOverLimit}
      />
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs ${isOverLimit ? "font-medium text-red-600" : "text-gray-400"}`}>
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
        <div role="status" className={`rounded-lg p-3 ${style.box}`}>
          <p className="font-semibold">{style.label}</p>
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

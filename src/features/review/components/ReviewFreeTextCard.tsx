"use client";

import { useId, useState } from "react";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { Button } from "@/components/Button";
import { cardCorrection } from "../review.logic";
import type { DueCard, ReviewResult } from "../review.schema";
import { ReviewCorrection } from "./ReviewCorrection";

/** Réponse libre : uniquement affichée à côté du corrigé, jamais envoyée (pas d'appel Gemini). */
const FREE_ANSWER_MAX_LENGTH = 2_000;

interface ReviewFreeTextCardProps {
  card: DueCard;
  recording: boolean;
  onAnswer: (result: ReviewResult) => void;
}

/**
 * Carte en réponse libre : l'apprenant écrit sa réponse, affiche le corrigé à côté de sa réponse,
 * puis s'auto-évalue (« Je savais » / « À revoir »).
 */
export function ReviewFreeTextCard({ card, recording, onAnswer }: ReviewFreeTextCardProps) {
  const [text, setText] = useState("");
  const [revealed, setRevealed] = useState(false);
  const fieldId = useId();
  const { answer, explanation } = cardCorrection(card);

  if (!revealed) {
    return (
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setRevealed(true);
        }}
      >
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          Votre réponse
        </label>
        <AutoResizeTextarea
          id={fieldId}
          value={text}
          maxLength={FREE_ANSWER_MAX_LENGTH}
          rows={3}
          onChange={(event) => setText(event.target.value)}
          placeholder="Écrivez ce dont vous vous souvenez…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <Button type="submit" className="w-full sm:w-auto">
          Voir la correction
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Votre réponse</p>
          {text.trim() ? (
            <p className="whitespace-pre-wrap break-words">{text}</p>
          ) : (
            <p className="italic text-gray-500">Aucune réponse saisie.</p>
          )}
        </div>
        <ReviewCorrection answer={answer} explanation={explanation} title="Corrigé" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" className="flex-1" loading={recording} onClick={() => onAnswer("correct")}>
          Je savais
        </Button>
        <Button type="button" variant="outline" className="flex-1" loading={recording} onClick={() => onAnswer("incorrect")}>
          À revoir
        </Button>
      </div>
    </div>
  );
}

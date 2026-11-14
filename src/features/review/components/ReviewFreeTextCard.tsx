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
        <label htmlFor={fieldId} className="kicker block">
          Votre réponse
        </label>
        <AutoResizeTextarea
          id={fieldId}
          value={text}
          maxLength={FREE_ANSWER_MAX_LENGTH}
          rows={3}
          onChange={(event) => setText(event.target.value)}
          placeholder="Écrivez ce dont vous vous souvenez…"
          className="w-full rounded-ctrl border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3"
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
        <div className="rounded-card border border-line bg-sunken p-4 text-sm text-ink">
          <p className="kicker mb-1.5">Votre réponse</p>
          {text.trim() ? (
            <p className="whitespace-pre-wrap break-words">{text}</p>
          ) : (
            <p className="italic text-ink-2">Aucune réponse saisie.</p>
          )}
        </div>
        <ReviewCorrection answer={answer} explanation={explanation} title="Corrigé" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" className="flex-1" loading={recording} onClick={() => onAnswer("correct")}>
          Je savais
        </Button>
        <Button type="button" variant="secondary" className="flex-1" loading={recording} onClick={() => onAnswer("incorrect")}>
          À revoir
        </Button>
      </div>
    </div>
  );
}

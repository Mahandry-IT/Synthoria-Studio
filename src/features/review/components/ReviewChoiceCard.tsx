"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Option } from "@/components/Check";
import { RichText } from "@/features/course/components/RichText";
import { cardCorrection, isChoiceCorrect } from "../review.logic";
import type { DueCard, ReviewResult } from "../review.schema";
import { ReviewCorrection } from "./ReviewCorrection";

interface ReviewChoiceCardProps {
  card: DueCard;
  recording: boolean;
  /** Le résultat de cette carte est enregistré : « Carte suivante » devient disponible. */
  recorded: boolean;
  /** Appelé à la validation avec le résultat calculé (envoyé automatiquement au serveur). */
  onValidate: (result: ReviewResult) => void;
  onNext: () => void;
}

/**
 * Carte en QCM : choisir puis « Valider ». La correction (bonnes réponses, explication) s'affiche
 * aussitôt et le résultat est envoyé automatiquement ; « Carte suivante » une fois enregistré.
 */
export function ReviewChoiceCard({ card, recording, recorded, onValidate, onNext }: ReviewChoiceCardProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const multiple = card.correct_indices.length > 1;
  const validated = result !== null;
  const { answer, explanation } = cardCorrection(card);

  const toggle = (index: number) => {
    if (validated) return;
    setSelected((current) =>
      multiple ? (current.includes(index) ? current.filter((i) => i !== index) : [...current, index]) : [index],
    );
  };

  const validate = () => {
    const computed: ReviewResult = isChoiceCorrect(card.correct_indices, selected) ? "correct" : "incorrect";
    setResult(computed);
    onValidate(computed);
  };

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="kicker mb-3">{multiple ? "Plusieurs réponses possibles" : "Une seule réponse"}</legend>
        {card.choices.map((choice, index) => {
          const isCorrect = card.correct_indices.includes(index);
          const chosen = selected.includes(index);
          const tone = validated ? (isCorrect ? "ok" : chosen ? "err" : undefined) : undefined;
          return (
            <Option
              key={index}
              type={multiple ? "checkbox" : "radio"}
              name={`choice-${card.card_id}`}
              tone={tone}
              checked={chosen}
              disabled={validated}
              onChange={() => toggle(index)}
              label={
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <RichText text={choice} className="text-ink" />
                  {validated && isCorrect && <span className="text-xs font-medium text-ok">✓ Bonne réponse</span>}
                  {validated && chosen && !isCorrect && <span className="text-xs font-medium text-err">✗ Votre choix</span>}
                </span>
              }
            />
          );
        })}
      </fieldset>

      {!validated ? (
        <Button type="button" className="w-full sm:w-auto" disabled={selected.length === 0} onClick={validate}>
          Valider
        </Button>
      ) : (
        <div className="space-y-4">
          <p role="status" className={`text-sm font-semibold ${result === "correct" ? "text-ok" : "text-err"}`}>
            {result === "correct" ? "Bonne réponse !" : "Pas tout à fait."}
          </p>
          <ReviewCorrection answer={answer} explanation={explanation} />
          {recorded ? (
            <Button type="button" className="w-full sm:w-auto" onClick={onNext}>
              Carte suivante
            </Button>
          ) : (
            <Button type="button" variant="secondary" className="w-full sm:w-auto" loading={recording} onClick={() => onValidate(result)}>
              {recording ? "Enregistrement…" : "Renvoyer le résultat"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

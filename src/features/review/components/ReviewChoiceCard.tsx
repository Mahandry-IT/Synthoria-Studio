"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
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

function optionClass(validated: boolean, isCorrect: boolean, chosen: boolean): string {
  if (!validated) return chosen ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:bg-gray-50";
  if (isCorrect) return "border-green-500 bg-green-50";
  if (chosen) return "border-red-500 bg-red-50";
  return "border-gray-200 opacity-70";
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
        <legend className="mb-2 text-xs text-gray-500">
          {multiple ? "Plusieurs réponses possibles" : "Une seule réponse"}
        </legend>
        {card.choices.map((choice, index) => {
          const isCorrect = card.correct_indices.includes(index);
          const chosen = selected.includes(index);
          return (
            <label
              key={index}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${optionClass(validated, isCorrect, chosen)}`}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={`choice-${card.card_id}`}
                className="h-4 w-4 accent-indigo-600"
                checked={chosen}
                disabled={validated}
                onChange={() => toggle(index)}
              />
              <RichText text={choice} className="flex-1 text-gray-800" />
              {validated && isCorrect && <span className="text-xs font-medium text-green-700">✓ Bonne réponse</span>}
              {validated && chosen && !isCorrect && <span className="text-xs font-medium text-red-700">✗ Votre choix</span>}
            </label>
          );
        })}
      </fieldset>

      {!validated ? (
        <Button type="button" className="w-full sm:w-auto" disabled={selected.length === 0} onClick={validate}>
          Valider
        </Button>
      ) : (
        <div className="space-y-4">
          <p role="status" className={`text-sm font-semibold ${result === "correct" ? "text-green-700" : "text-red-700"}`}>
            {result === "correct" ? "Bonne réponse !" : "Pas tout à fait."}
          </p>
          <ReviewCorrection answer={answer} explanation={explanation} />
          {recorded ? (
            <Button type="button" className="w-full sm:w-auto" onClick={onNext}>
              Carte suivante
            </Button>
          ) : (
            <Button type="button" variant="outline" className="w-full sm:w-auto" loading={recording} onClick={() => onValidate(result)}>
              {recording ? "Enregistrement…" : "Renvoyer le résultat"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useId } from "react";
import type { QuizQuestion } from "../course.types";

interface QuizQuestionNumericProps {
  question: Pick<QuizQuestion, "unit">;
  /** Saisie brute : la virgule française et le point sont acceptés (voir `parseNumericInput`). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Aide sous le champ ; par défaut, le quiz autorise une réponse vide. */
  hint?: string;
}

/** Champ de réponse d'une question numérique ; une valeur vide est autorisée. */
export function QuizQuestionNumeric({ question, value, onChange, disabled = false, hint = "Un nombre, avec une virgule ou un point. Tu peux laisser vide." }: QuizQuestionNumericProps) {
  const id = useId();
  const unitId = `${id}-unit`;
  const hintId = `${id}-hint`;
  const unit = question.unit?.trim();

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        Ta réponse
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={unit ? `${hintId} ${unitId}` : hintId}
          className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {unit && (
          <span id={unitId} className="text-sm text-gray-600">
            {unit}
          </span>
        )}
      </div>
      <p id={hintId} className="text-xs text-gray-500">
        {hint}
      </p>
    </div>
  );
}

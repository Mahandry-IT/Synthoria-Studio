"use client";

import { useId } from "react";
import { LatexText } from "@/shared/utils/latex";
import type { QuizQuestion } from "../course.types";
import { availableOptions } from "../quizGrading";

interface QuizQuestionMatchingProps {
  question: Pick<QuizQuestion, "subjects" | "options">;
  /** Option choisie par sujet (null = vide). */
  selections: (number | null)[];
  onChange: (subjectIndex: number, optionIndex: number | null) => void;
  disabled?: boolean;
}

/**
 * Appariement : une ligne par sujet avec une liste déroulante (accessible au clavier).
 * Une option choisie pour un sujet disparaît des listes des autres ; la valeur vide la remet à disposition.
 */
export function QuizQuestionMatching({ question, selections, onChange, disabled = false }: QuizQuestionMatchingProps) {
  const id = useId();
  const subjects = question.subjects ?? [];

  return (
    <ul className="space-y-2" aria-label="Associations">
      {subjects.map((subject, i) => {
        const selectId = `${id}-${i}`;
        const choices = availableOptions(question.options, selections, i);
        return (
          <li key={i} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center">
            <label htmlFor={selectId} className="flex-1 text-sm text-gray-700">
              <LatexText text={subject} autoMath />
            </label>
            <select
              id={selectId}
              value={selections[i] ?? ""}
              disabled={disabled}
              onChange={(e) => onChange(i, e.target.value === "" ? null : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-64"
            >
              <option value="">—</option>
              {choices.map(({ index, label }) => (
                <option key={index} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </li>
        );
      })}
    </ul>
  );
}

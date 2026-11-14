"use client";

import { useId } from "react";
import { Select } from "@/components/Input";
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
          <li key={i} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3 sm:flex-row sm:items-center">
            <label htmlFor={selectId} className="flex-1 text-sm text-ink">
              <LatexText text={subject} autoMath />
            </label>
            <Select
              id={selectId}
              value={selections[i] ?? ""}
              disabled={disabled}
              onChange={(e) => onChange(i, e.target.value === "" ? null : Number(e.target.value))}
              fullWidth={false}
              className="w-full sm:w-64"
            >
              <option value="">—</option>
              {choices.map(({ index, label }) => (
                <option key={index} value={index}>
                  {label}
                </option>
              ))}
            </Select>
          </li>
        );
      })}
    </ul>
  );
}

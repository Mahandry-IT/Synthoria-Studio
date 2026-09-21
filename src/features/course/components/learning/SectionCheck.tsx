"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { LatexText } from "@/shared/utils/latex";
import type { QuizQuestion } from "../../course.types";
import { isAnswerCorrect, optionFeedback } from "../../quizGrading";

interface CheckQuestionProps {
  question: QuizQuestion;
  index: number;
  onChecked: () => void;
}

/** Une question « Vérifie » : validation explicite puis retour immédiat, option par option. */
function CheckQuestion({ question, index, onChecked }: CheckQuestionProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [validated, setValidated] = useState(false);
  const multiple = question.correct_option_indices.length > 1;
  const correct = validated && isAnswerCorrect(question, selected);

  const toggle = (i: number) => {
    if (validated) return;
    setSelected((current) =>
      multiple ? (current.includes(i) ? current.filter((v) => v !== i) : [...current, i]) : [i],
    );
  };

  const validate = () => {
    setValidated(true);
    onChecked();
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-900">
        <span className="mr-2 text-xs text-gray-500">{index + 1}.</span>
        <LatexText text={question.question} />
      </legend>
      {multiple && <p className="text-xs text-gray-500">Plusieurs réponses possibles.</p>}
      {question.options.map((option, i) => (
        <label key={i} className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type={multiple ? "checkbox" : "radio"}
            name={`check-${index}-${question.question.slice(0, 20)}`}
            checked={selected.includes(i)}
            disabled={validated}
            onChange={() => toggle(i)}
            className="mt-1"
          />
          <LatexText text={option} autoMath />
        </label>
      ))}
      {!validated ? (
        <Button type="button" size="sm" disabled={selected.length === 0} onClick={validate}>
          Vérifier
        </Button>
      ) : (
        <div role="status" className={`rounded-lg p-3 text-sm ${correct ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
          <p className="font-semibold">{correct ? "Bonne réponse !" : "Pas tout à fait."}</p>
          <ul className="mt-1 space-y-1">
            {optionFeedback(question, selected).map((f) =>
              f.text ? (
                <li key={f.index}>
                  <span className="font-medium">{f.isCorrectOption ? "✓" : "✗"} </span>
                  <LatexText text={f.text} />
                </li>
              ) : null,
            )}
          </ul>
          {question.explanation && (
            <p className="mt-2 text-xs opacity-80">
              <LatexText text={question.explanation} />
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}

interface SectionCheckProps {
  questions: QuizQuestion[];
  /** Appelé quand toutes les questions ont été validées : la section est « terminée ». */
  onComplete: () => void;
}

/** « Vérifie » : 2-3 questions rapides à la fin de la section, retour immédiat. */
export function SectionCheck({ questions, onComplete }: SectionCheckProps) {
  const [checked, setChecked] = useState(0);

  if (questions.length === 0) return null;

  const handleChecked = () => {
    const next = checked + 1;
    setChecked(next);
    if (next >= questions.length) onComplete();
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vérifie</p>
      {questions.map((q, i) => (
        <CheckQuestion key={i} question={q} index={i} onChecked={handleChecked} />
      ))}
    </div>
  );
}

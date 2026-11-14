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
      <legend className="text-sm font-medium text-ink">
        <span className="mr-2 font-mono text-xs text-ink-3">{index + 1}.</span>
        <LatexText text={question.question} />
      </legend>
      {multiple && <p className="text-xs text-ink-3">Plusieurs réponses possibles.</p>}
      {question.options.map((option, i) => (
        <label key={i} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-ink">
          <input
            type={multiple ? "checkbox" : "radio"}
            name={`check-${index}-${question.question.slice(0, 20)}`}
            checked={selected.includes(i)}
            disabled={validated}
            onChange={() => toggle(i)}
            className="h-4 w-4 shrink-0 accent-primary"
          />
          <LatexText text={option} autoMath />
        </label>
      ))}
      {!validated ? (
        <Button type="button" size="sm" disabled={selected.length === 0} onClick={validate}>
          Vérifier
        </Button>
      ) : (
        <div
          role="status"
          className={`rounded-card border-l-[3px] p-3 text-sm text-ink ${correct ? "border-ok bg-ok-soft" : "border-err bg-err-soft"}`}
        >
          <p className={`font-semibold ${correct ? "text-ok" : "text-err"}`}>{correct ? "Bonne réponse !" : "Pas tout à fait."}</p>
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
            <p className="mt-2 text-xs text-ink-2">
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
  /** Le titre « Vérifie » est déjà porté par l'étape du lecteur progressif. */
  hideTitle?: boolean;
}

/** « Vérifie » : 2-3 questions rapides à la fin de la section, retour immédiat. */
export function SectionCheck({ questions, onComplete, hideTitle = false }: SectionCheckProps) {
  const [checked, setChecked] = useState(0);

  if (questions.length === 0) return null;

  const handleChecked = () => {
    const next = checked + 1;
    setChecked(next);
    if (next >= questions.length) onComplete();
  };

  return (
    <div className="space-y-4 rounded-card border border-line bg-surface p-4">
      {!hideTitle && <p className="kicker font-semibold">Vérifie</p>}
      {questions.map((q, i) => (
        <CheckQuestion key={i} question={q} index={i} onChecked={handleChecked} />
      ))}
    </div>
  );
}

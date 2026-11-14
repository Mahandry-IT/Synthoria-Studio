"use client";

import { useId, useState } from "react";
import { LatexText } from "@/shared/utils/latex";
import type { StepSupport } from "../../course.types";
import { checkClassify, classifySolution } from "../../cycleActions";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { ActionFrame, WrongFlag, wrongBorder } from "./ActionFrame";
import { TOUCH_TARGET } from "./cycleUi";

type ClassifySupport = Extract<StepSupport, { kind: "classify" }>;

interface ClassifyActionProps {
  support: ClassifySupport;
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}

/**
 * Classer chaque cas dans une catégorie : un groupe de boutons radio par cas (clavier : flèches ;
 * tactile : cibles de 44 px). Aucun glisser-déposer.
 */
export function ClassifyAction({ support, answer, onAnswer }: ClassifyActionProps) {
  const base = useId();
  const solution = classifySolution(support.cases);
  const [draft, setAssignment] = useState<(number | null)[]>(() => support.cases.map(() => null));
  // Une réponse déjà donnée (reprise après rafraîchissement) prime sur le brouillon local.
  const assignment = answer ? solution : draft;

  return (
    <ActionFrame
      instruction="Classe chaque cas dans la bonne catégorie."
      answer={answer}
      onAnswer={onAnswer}
      check={() => checkClassify(support.cases, assignment)}
      showSolution={() => setAssignment(solution)}
    >
      {({ wrong, locked }) => (
        <div className="space-y-3">
          {support.cases.map((item, i) => (
            <fieldset key={i} className={`min-w-0 rounded-lg border p-3 ${wrongBorder(wrong.includes(i))}`}>
              <legend className="flex items-center gap-2 px-1 text-sm font-medium text-gray-900">
                <LatexText text={item.label} />
                <WrongFlag show={wrong.includes(i)} />
              </legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {support.categories.map((category, c) => (
                  <label
                    key={c}
                    className={`inline-flex ${TOUCH_TARGET} items-center gap-2 rounded-lg border px-3 text-sm focus-within:ring-2 focus-within:ring-indigo-500 ${
                      assignment[i] === c ? "border-indigo-500 bg-indigo-50 text-indigo-900" : "border-gray-200 text-gray-700"
                    } ${locked ? "cursor-default" : "cursor-pointer hover:bg-gray-50"}`}
                  >
                    <input
                      type="radio"
                      name={`${base}-${i}`}
                      checked={assignment[i] === c}
                      disabled={locked}
                      onChange={() => setAssignment((cur) => cur.map((v, k) => (k === i ? c : v)))}
                      className="h-4 w-4 text-indigo-600 focus:outline-none"
                    />
                    <LatexText text={category} />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </ActionFrame>
  );
}

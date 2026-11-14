"use client";

import { useId, useState } from "react";
import { Option } from "@/components/Check";
import { LatexText } from "@/shared/utils/latex";
import type { StepSupport } from "../../course.types";
import { checkClassify, classifySolution } from "../../cycleActions";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { ActionFrame, WrongFlag, wrongBorder } from "./ActionFrame";

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
            <fieldset key={i} className={`min-w-0 rounded-ctrl border p-3 ${wrongBorder(wrong.includes(i))}`}>
              <legend className="flex items-center gap-2 px-1 text-sm font-medium text-ink">
                <LatexText text={item.label} />
                <WrongFlag show={wrong.includes(i)} />
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
                {support.categories.map((category, c) => (
                  <Option
                    key={c}
                    type="radio"
                    name={`${base}-${i}`}
                    checked={assignment[i] === c}
                    disabled={locked}
                    onChange={() => setAssignment((cur) => cur.map((v, k) => (k === i ? c : v)))}
                    label={<LatexText text={category} />}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </ActionFrame>
  );
}

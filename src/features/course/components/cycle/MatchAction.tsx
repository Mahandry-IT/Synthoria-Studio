"use client";

import { useId, useMemo, useState } from "react";
import { LatexText } from "@/shared/utils/latex";
import type { StepSupport } from "../../course.types";
import { buildMatch, checkMatch, matchSolution } from "../../cycleActions";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { availableOptions } from "../../quizGrading";
import { ActionFrame, WrongFlag, wrongBorder } from "./ActionFrame";
import { TOUCH_TARGET } from "./cycleUi";

type MatchSupport = Extract<StepSupport, { kind: "match" }>;

interface MatchActionProps {
  support: MatchSupport;
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}

/**
 * Associer chaque terme de gauche à un terme de droite via une liste déroulante native (clavier et
 * tactile). Un terme de droite déjà choisi n'est plus proposé aux autres lignes.
 */
export function MatchAction({ support, answer, onAnswer }: MatchActionProps) {
  const base = useId();
  const setup = useMemo(() => buildMatch(support.match_pairs), [support.match_pairs]);
  const [draft, setGiven] = useState<(number | null)[]>(() => support.match_pairs.map(() => null));
  const given = answer ? matchSolution(setup) : draft;

  return (
    <ActionFrame
      instruction="Associe chaque élément à sa correspondance."
      answer={answer}
      onAnswer={onAnswer}
      check={() => checkMatch(setup.correct, given)}
      showSolution={() => setGiven(matchSolution(setup))}
    >
      {({ wrong, locked }) => (
        <ul className="space-y-3">
          {support.match_pairs.map((pair, i) => (
            <li key={i} className={`rounded-lg border p-3 ${wrongBorder(wrong.includes(i))}`}>
              <label htmlFor={`${base}-${i}`} className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-900">
                <LatexText text={pair.left} />
                <WrongFlag show={wrong.includes(i)} />
              </label>
              <select
                id={`${base}-${i}`}
                value={given[i] ?? ""}
                disabled={locked}
                onChange={(e) =>
                  setGiven((cur) => cur.map((v, k) => (k === i ? (e.target.value === "" ? null : Number(e.target.value)) : v)))
                }
                className={`${TOUCH_TARGET} w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">Choisir…</option>
                {availableOptions(setup.options, given, i).map((option) => (
                  <option key={option.index} value={option.index}>
                    {option.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </ActionFrame>
  );
}

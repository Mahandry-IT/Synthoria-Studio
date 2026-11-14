"use client";

import { useId, useMemo, useState } from "react";
import { RichText } from "../RichText";
import type { StepSupport } from "../../course.types";
import { blankIndex, checkFillTable, fillChoices, fillSolution } from "../../cycleActions";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { ActionFrame, WrongFlag } from "./ActionFrame";
import { TOUCH_TARGET } from "./cycleUi";

type FillSupport = Extract<StepSupport, { kind: "fill_table" }>;

interface FillTableActionProps {
  support: FillSupport;
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}

/**
 * Tableau dont certaines cases sont masquées : chaque case se complète par une liste déroulante native
 * (bonnes réponses et leurres). Le tableau défile horizontalement dans son cadre sur mobile.
 */
export function FillTableAction({ support, answer, onAnswer }: FillTableActionProps) {
  const base = useId();
  const { table, blanks } = support;
  const choices = useMemo(() => fillChoices(table, blanks, support.distractors), [table, blanks, support.distractors]);
  const solution = fillSolution(table, blanks);
  const [draft, setChosen] = useState<(string | null)[]>(() => blanks.map(() => null));
  const chosen = answer ? solution : draft;

  return (
    <ActionFrame
      instruction="Complète les cases masquées du tableau."
      answer={answer}
      onAnswer={onAnswer}
      check={() => checkFillTable(table, blanks, chosen)}
      showSolution={() => setChosen(solution)}
    >
      {({ wrong, locked }) => (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-sm">
            {table.caption && (
              <caption className="caption-top px-3 py-2 text-left text-sm font-semibold text-gray-900">{table.caption}</caption>
            )}
            <thead>
              <tr className="bg-indigo-100">
                {table.headers.map((h, c) => (
                  <th key={c} scope="col" className="border border-indigo-200 px-3 py-2 text-left font-semibold text-indigo-800">
                    <RichText text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r} className={r % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {table.headers.map((_, c) => {
                    const b = blankIndex(blanks, r, c);
                    return (
                      <td key={c} className="border border-gray-200 px-3 py-2 align-top text-gray-700">
                        {b < 0 ? (
                          <RichText text={row[c] ?? ""} />
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              id={`${base}-${b}`}
                              aria-label={`Case à compléter : ligne ${r + 1}, colonne ${c + 1}`}
                              value={chosen[b] ?? ""}
                              disabled={locked}
                              onChange={(e) =>
                                setChosen((cur) => cur.map((v, k) => (k === b ? (e.target.value === "" ? null : e.target.value) : v)))
                              }
                              className={`${TOUCH_TARGET} min-w-32 rounded-lg border bg-white px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                wrong.includes(b) ? "border-red-400" : "border-gray-300"
                              }`}
                            >
                              <option value="">Choisir…</option>
                              {choices.map((choice) => (
                                <option key={choice} value={choice}>
                                  {choice}
                                </option>
                              ))}
                            </select>
                            <WrongFlag show={wrong.includes(b)} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ActionFrame>
  );
}

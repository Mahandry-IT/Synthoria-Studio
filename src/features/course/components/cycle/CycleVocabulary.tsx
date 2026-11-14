import { LatexText } from "@/shared/utils/latex";
import { stripMathDelimiters } from "@/shared/utils/mathNotation";
import type { VocabTerm } from "../../course.types";
import { RichText } from "../RichText";

/**
 * « Le mot juste » : tableau Terme / En clair, formule en LaTeX si présente. Le tableau défile
 * horizontalement dans son cadre sur mobile ; textes rendus sans HTML.
 */
export function CycleVocabulary({ terms }: { terms: VocabTerm[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Vocabulaire de la section</caption>
        <thead>
          <tr className="bg-indigo-100">
            <th scope="col" className="border border-indigo-200 px-3 py-2 text-left font-semibold text-indigo-800">
              Terme
            </th>
            <th scope="col" className="border border-indigo-200 px-3 py-2 text-left font-semibold text-indigo-800">
              En clair
            </th>
          </tr>
        </thead>
        <tbody>
          {terms.map((entry, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <th scope="row" className="border border-gray-200 px-3 py-2 text-left align-top font-medium text-gray-900">
                <LatexText text={entry.term} />
              </th>
              <td className="border border-gray-200 px-3 py-2 align-top text-gray-700">
                <RichText text={entry.plain} />
                {entry.formula_latex.trim() && (
                  <div className="mt-1 overflow-x-auto">
                    <LatexText text={`$${stripMathDelimiters(entry.formula_latex)}$`} />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

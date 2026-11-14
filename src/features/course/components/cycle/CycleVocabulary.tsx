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
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Vocabulaire de la section</caption>
        <thead>
          <tr className="bg-primary-soft">
            <th scope="col" className="border-b border-line px-3.5 py-2.5 text-left font-semibold text-primary">
              Terme
            </th>
            <th scope="col" className="border-b border-line px-3.5 py-2.5 text-left font-semibold text-primary">
              En clair
            </th>
          </tr>
        </thead>
        <tbody>
          {terms.map((entry, i) => (
            <tr key={i} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-3.5 py-2.5 text-left align-top font-medium text-ink">
                <LatexText text={entry.term} />
              </th>
              <td className="px-3.5 py-2.5 align-top text-ink-2">
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

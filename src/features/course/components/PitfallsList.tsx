"use client";

import type { CoursePitfall } from "../course.types";
import { LatexText } from "@/shared/utils/latex";

interface PitfallsListProps {
  pitfalls: CoursePitfall[];
}

/**
 * Affiche les pièges courants.
 * L'API utilise description/why_it_happens/how_to_avoid.
 */
export function PitfallsList({ pitfalls }: PitfallsListProps) {
  if (pitfalls.length === 0) return null;

  return (
    <section aria-labelledby="pitfalls-heading">
      <h2 id="pitfalls-heading" className="text-lg font-semibold text-gray-900 mb-3">
        Pièges courants
      </h2>
      <ul className="space-y-3">
        {pitfalls.map((pitfall, i) => (
          <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              <LatexText text={pitfall.description} />
            </p>
            {pitfall.why_it_happens && (
              <p className="mt-2 text-sm text-amber-700">
                <span className="font-medium">Pourquoi :</span>{" "}
                <LatexText text={pitfall.why_it_happens} />
              </p>
            )}
            {pitfall.how_to_avoid && (
              <p className="mt-1 text-xs text-amber-600 italic">
                💡 <LatexText text={pitfall.how_to_avoid} />
              </p>
            )}
            {/* Legacy fallback */}
            {!pitfall.why_it_happens && pitfall.tip && (
              <p className="mt-1 text-xs text-amber-600 italic">
                💡 <LatexText text={pitfall.tip} />
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

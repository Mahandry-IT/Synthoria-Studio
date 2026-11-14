"use client";

import type { CoursePitfall } from "../course.types";
import { RichText } from "./RichText";

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
      <h2 id="pitfalls-heading" className="mb-3 font-serif text-lg font-semibold text-ink">
        Pièges courants
      </h2>
      <ul className="space-y-3">
        {pitfalls.map((pitfall, i) => (
          <li key={i} className="rounded-card border-l-[3px] border-warn bg-warn-soft p-4">
            <p className="text-sm font-semibold text-warn">
              <RichText text={pitfall.description} />
            </p>
            {pitfall.why_it_happens && (
              <p className="mt-2 text-sm text-ink-2">
                <span className="font-medium">Pourquoi :</span>{" "}
                <RichText text={pitfall.why_it_happens} />
              </p>
            )}
            {pitfall.how_to_avoid && (
              <p className="mt-1 text-xs italic text-ink-2">
                💡 <RichText text={pitfall.how_to_avoid} />
              </p>
            )}
            {/* Legacy fallback */}
            {!pitfall.why_it_happens && pitfall.tip && (
              <p className="mt-1 text-xs italic text-ink-2">
                💡 <RichText text={pitfall.tip} />
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

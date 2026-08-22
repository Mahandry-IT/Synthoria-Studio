"use client";

import type { CoursePitfall } from "../course.types";

interface PitfallsListProps {
  pitfalls: CoursePitfall[];
}

/**
 * Affiche les pièges courants.
 * ⚠️ Affiché si `common_pitfalls` non null.
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
            <h3 className="text-sm font-semibold text-amber-800">{pitfall.title}</h3>
            <p className="mt-1 text-sm text-amber-700">{pitfall.description}</p>
            {pitfall.tip && (
              <p className="mt-2 text-xs text-amber-600 italic">
                💡 {pitfall.tip}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

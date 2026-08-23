"use client";

import { LatexText } from "@/shared/utils/latex";

interface NextStepsListProps {
  steps: string[];
}

/**
 * Affiche les prochaines étapes suggérées avec rendu LaTeX.
 */
export function NextStepsList({ steps }: NextStepsListProps) {
  if (steps.length === 0) return null;

  return (
    <section aria-labelledby="next-steps-heading">
      <h2 id="next-steps-heading" className="text-sm font-semibold text-gray-700 mb-2">
        Prochaines étapes
      </h2>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
              {i + 1}
            </span>
            <span><LatexText text={step} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

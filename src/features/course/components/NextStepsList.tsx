"use client";

import { RichText } from "./RichText";

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
      <h2 id="next-steps-heading" className="mb-2 text-sm font-semibold text-ink">
        Prochaines étapes
      </h2>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sunken font-mono text-xs font-bold text-ink-3">
              {i + 1}
            </span>
            <span><RichText text={step} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

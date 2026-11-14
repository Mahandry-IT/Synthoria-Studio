"use client";

import { RichText } from "./RichText";

interface SummaryBlockProps {
  summary: string;
}

/**
 * Affiche le résumé du cours avec rendu LaTeX.
 */
export function SummaryBlock({ summary }: SummaryBlockProps) {
  if (!summary || summary.trim().length === 0) return null;

  return (
    <section aria-labelledby="summary-heading" className="rounded-card bg-primary-soft p-5">
      <h2 id="summary-heading" className="mb-2 text-sm font-semibold text-primary">
        Résumé
      </h2>
      <p className="font-serif text-base leading-relaxed text-ink">
        <RichText text={summary} />
      </p>
    </section>
  );
}

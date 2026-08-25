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
    <section aria-labelledby="summary-heading" className="rounded-lg bg-indigo-50 p-5">
      <h2 id="summary-heading" className="text-sm font-semibold text-indigo-800 mb-2">
        Résumé
      </h2>
      <p className="text-sm text-indigo-700 leading-relaxed">
        <RichText text={summary} />
      </p>
    </section>
  );
}

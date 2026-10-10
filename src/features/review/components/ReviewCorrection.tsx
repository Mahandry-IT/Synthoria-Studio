"use client";

import { RichText } from "@/features/course/components/RichText";

interface ReviewCorrectionProps {
  answer: string;
  explanation: string;
  /** Titre du bloc (« Réponse », « Corrigé »…). */
  title?: string;
}

/** Bloc de correction d'une carte : bonne réponse en gras puis explication. */
export function ReviewCorrection({ answer, explanation, title = "Réponse" }: ReviewCorrectionProps) {
  return (
    <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">{title}</p>
      {answer && <RichText text={answer} className="block font-semibold" />}
      {explanation && <RichText text={explanation} className="mt-2 block opacity-80" />}
    </div>
  );
}

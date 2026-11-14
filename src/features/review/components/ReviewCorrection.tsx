"use client";

import { RichText } from "@/features/course/components/RichText";

interface ReviewCorrectionProps {
  answer: string;
  explanation: string;
  /** Titre du bloc (« Réponse », « Corrigé »…). */
  title?: string;
}

/** Bloc de correction d'une carte : bonne réponse en serif puis explication, filet gauche accent. */
export function ReviewCorrection({ answer, explanation, title = "Réponse" }: ReviewCorrectionProps) {
  return (
    <div className="rounded-card border-l-[3px] border-accent bg-primary-soft p-4 text-sm text-ink">
      <p className="kicker mb-1.5">{title}</p>
      {answer && <RichText text={answer} className="block font-serif text-lg text-ink" />}
      {explanation && <RichText text={explanation} className="mt-2 block text-ink-2" />}
    </div>
  );
}

"use client";

import { ReviewSession } from "@/features/review/components/ReviewSession";

/** Révision espacée : flashcards issues des questions « Vérifie » de vos cours. */
export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Révision</h1>
        <p className="mt-1 text-sm text-gray-500">
          Les cartes que vous maîtrisez reviennent de moins en moins souvent (J+1, J+3, J+7, J+21).
        </p>
      </div>
      <ReviewSession />
    </div>
  );
}

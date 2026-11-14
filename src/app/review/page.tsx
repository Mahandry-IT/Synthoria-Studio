"use client";

import { PageHeader } from "@/components/PageHeader";
import { ReviewSession } from "@/features/review/components/ReviewSession";

/** Révision espacée : flashcards issues des questions « Vérifie » de vos cours. */
export default function ReviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Série du jour"
        title="Révision"
        description="Les cartes que vous maîtrisez reviennent de moins en moins souvent (J+1, J+3, J+7, J+21)."
      />
      <ReviewSession />
    </div>
  );
}

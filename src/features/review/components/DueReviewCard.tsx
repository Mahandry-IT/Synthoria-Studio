"use client";

import Link from "next/link";
import StyleIcon from "@mui/icons-material/Style";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { DashboardCardSkeleton } from "@/features/dashboard/components/DashboardCardSkeleton";
import { useDueCards } from "../hooks/useReview";

/** Carte « À réviser aujourd'hui » du dashboard : nombre de flashcards dues et accès à la session. */
export function DueReviewCard() {
  const { data, isLoading, error, refetch } = useDueCards(1);

  if (isLoading) return <DashboardCardSkeleton label="cartes à réviser" />;
  if (error) {
    return (
      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">À réviser aujourd&apos;hui</h2>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Card>
    );
  }

  const due = data?.total_due ?? 0;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <StyleIcon fontSize="small" className="text-indigo-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-gray-900">À réviser aujourd&apos;hui</h2>
      </div>
      {due === 0 ? (
        <p className="text-sm text-gray-600">Aucune carte à réviser pour le moment. Bravo !</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            <span className="text-2xl font-bold text-gray-900">{due}</span> carte{due > 1 ? "s" : ""} à réviser.
          </p>
          <Link
            href="/review"
            className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Commencer la révision
          </Link>
        </>
      )}
    </Card>
  );
}

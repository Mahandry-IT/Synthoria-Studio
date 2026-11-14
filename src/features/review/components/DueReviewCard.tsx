"use client";

import StyleIcon from "@mui/icons-material/Style";
import { ButtonLink } from "@/components/ButtonLink";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { SectionHeading } from "@/components/PageHeader";
import { DashboardCardSkeleton } from "@/features/dashboard/components/DashboardCardSkeleton";
import { useDueCards } from "../hooks/useReview";

/** Section « À réviser aujourd'hui » du dashboard : nombre de flashcards dues et accès à la session. */
export function DueReviewCard() {
  const { data, isLoading, error, refetch } = useDueCards(1);

  if (isLoading) return <DashboardCardSkeleton label="cartes à réviser" />;
  if (error) {
    return (
      <section>
        <SectionHeading title="À réviser aujourd'hui" />
        <div className="mt-4">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  const due = data?.total_due ?? 0;

  return (
    <section>
      <SectionHeading title="À réviser aujourd'hui" />
      {due === 0 ? (
        <EmptyState className="mt-4" icon={<StyleIcon fontSize="small" />} title="Aucune carte à réviser pour le moment. Bravo !" />
      ) : (
        <div className="pt-6">
          <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 font-serif text-xl text-ink-2">
            <span className="num text-[clamp(4.5rem,20vw,8.5rem)] text-primary">{due}</span>
            <span>carte{due > 1 ? "s" : ""} à réviser.</span>
          </p>
          <ButtonLink href="/review" className="mt-5 w-full sm:w-auto">
            Commencer la révision
          </ButtonLink>
        </div>
      )}
    </section>
  );
}

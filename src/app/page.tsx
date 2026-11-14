"use client";

import { ButtonLink } from "@/components/ButtonLink";
import { PageHeader } from "@/components/PageHeader";
import { PendingPlansList } from "@/features/dashboard/components/PendingPlansList";
import { RecentPodcastsCard } from "@/features/dashboard/components/RecentPodcastsCard";
import { useKickerDate } from "@/features/dashboard/hooks/useKickerDate";
import { DueReviewCard } from "@/features/review/components/DueReviewCard";

/**
 * Tableau de bord : cartes à réviser, plans en attente de validation (colonne principale) et
 * derniers podcasts. Chaque section charge et échoue indépendamment des autres.
 */
export default function DashboardPage() {
  const kicker = useKickerDate();

  return (
    <div className="space-y-10">
      <PageHeader
        // espace insécable : la ligne du kicker garde sa hauteur avant que la date soit connue
        kicker={kicker || " "}
        title="Tableau de bord"
        description="Révisez vos cartes du jour, retrouvez vos derniers podcasts et reprenez les plans de cours que vous n'avez pas encore validés."
        actions={
          <ButtonLink href="/ask" variant="accent" className="w-full sm:w-auto">
            Nouveau cours
          </ButtonLink>
        }
      />

      <div className="min-w-0 space-y-10">
        <DueReviewCard />
        <PendingPlansList />
        <RecentPodcastsCard />
      </div>
    </div>
  );
}

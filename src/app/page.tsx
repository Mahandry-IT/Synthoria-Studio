"use client";

import { PendingPlansList } from "@/features/dashboard/components/PendingPlansList";
import { RecentPodcastsCard } from "@/features/dashboard/components/RecentPodcastsCard";
import { DueReviewCard } from "@/features/review/components/DueReviewCard";

/**
 * Tableau de bord : derniers podcasts (une carte) et plans de cours en attente de validation.
 * Chaque carte charge et échoue indépendamment de l'autre.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Révisez vos cartes du jour, retrouvez vos derniers podcasts et reprenez les plans de cours que vous n&apos;avez pas encore validés.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DueReviewCard />
        <RecentPodcastsCard />
        <PendingPlansList />
      </div>
    </div>
  );
}

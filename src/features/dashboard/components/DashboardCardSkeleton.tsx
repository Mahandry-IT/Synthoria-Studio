import { Card } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";

/** Squelette d'une carte du dashboard (titre + lignes) pendant son chargement. */
export function DashboardCardSkeleton({ label }: { label: string }) {
  return (
    <Card className="p-5" aria-busy="true">
      <span className="sr-only" role="status">
        Chargement : {label}
      </span>
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200" aria-hidden="true" />
      <Skeleton lines={2} aria-hidden="true" />
      <Skeleton lines={2} aria-hidden="true" />
      <Skeleton lines={2} aria-hidden="true" />
    </Card>
  );
}

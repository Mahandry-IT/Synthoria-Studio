import { Skeleton } from "@/components/Skeleton";

/** Squelette d'une section du dashboard (titre + lignes à filets) pendant son chargement. */
export function DashboardCardSkeleton({ label }: { label: string }) {
  return (
    <section aria-busy="true">
      <span className="sr-only" role="status">
        Chargement : {label}
      </span>
      <div className="border-b border-line pb-2" aria-hidden="true">
        <div className="skel h-6 w-40" />
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="border-b border-line py-4">
          <Skeleton lines={2} aria-hidden="true" />
        </div>
      ))}
    </section>
  );
}

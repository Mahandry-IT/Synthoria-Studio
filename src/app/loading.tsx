import { Skeleton } from "@/components/Skeleton";

/**
 * État de chargement global affiché par Next.js App Router
 * pendant le chargement d'une page (Suspense boundary).
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="skel h-8 w-48" />
      <div className="skel h-4 w-72" />
      <Skeleton lines={4} />
      <Skeleton lines={3} />
    </div>
  );
}

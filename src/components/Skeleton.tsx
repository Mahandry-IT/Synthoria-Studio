import { type HTMLAttributes, forwardRef } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
  className?: string;
}

/**
 * Placeholder de chargement animé.
 */
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ lines = 1, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={[
              "mb-2 h-4 rounded bg-gray-200 animate-pulse",
              i === lines - 1 ? "w-3/4" : "w-full",
            ].join(" ")}
          />
        ))}
      </div>
    );
  },
);

Skeleton.displayName = "Skeleton";
export { Skeleton };

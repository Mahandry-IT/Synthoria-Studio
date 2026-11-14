import { type HTMLAttributes, forwardRef } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
  className?: string;
}

/**
 * Placeholder de chargement : dégradé `sunken` / `line` (classe `.skel`, animation coupée
 * sous `prefers-reduced-motion`, voir globals.css).
 */
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ lines = 1, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`skel mb-2 h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
        ))}
      </div>
    );
  },
);

Skeleton.displayName = "Skeleton";
export { Skeleton };

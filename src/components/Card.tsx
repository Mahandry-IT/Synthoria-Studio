import { type HTMLAttributes, forwardRef } from "react";
import { cx } from "@/shared/utils/cx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Soulève l'ombre au survol (`shadow-lift`). */
  hover?: boolean;
}

/**
 * Carte conteneur : surface, bordure fine et ombre « papier ».
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(
          "rounded-card border border-line bg-surface text-ink shadow-paper",
          hover && "transition-shadow duration-(--d-std) hover:shadow-lift motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
export { Card };

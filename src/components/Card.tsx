import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

/**
 * Carte conteneur réutilisable avec ombre subtile.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-xl border border-gray-200 bg-white shadow-sm",
          hover && "transition-shadow hover:shadow-md",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
export { Card };

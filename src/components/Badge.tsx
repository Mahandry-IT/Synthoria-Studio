import { type HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "indigo" | "green" | "amber" | "gray" | "red";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  indigo: "bg-indigo-100 text-indigo-800",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  gray: "bg-gray-100 text-gray-700",
  red: "bg-red-100 text-red-800",
};

/**
 * Badge inline pour labels, statuts, modes.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "gray", className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variantClasses[variant],
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
export { Badge };

import { type HTMLAttributes, forwardRef } from "react";
import { cx } from "@/shared/utils/cx";

/** Tons du carnet éditorial. */
type BadgeTone = "ok" | "warn" | "err" | "neutral" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeTone;
}

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  err: "bg-err-soft text-err border-transparent",
  neutral: "bg-transparent text-ink-2 border-line-2",
  info: "bg-primary-soft text-primary border-transparent",
};

/**
 * Étiquette inline pour libellés, statuts et modes. Le sens passe par le texte, pas seulement la couleur.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "neutral", className = "", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-tag border px-2 py-[3px] text-xs font-medium",
          BADGE_TONE_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
export { Badge };

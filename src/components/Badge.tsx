import { type HTMLAttributes, forwardRef } from "react";
import { cx } from "@/shared/utils/cx";

/** Tons du carnet éditorial. */
type BadgeTone = "ok" | "warn" | "err" | "neutral" | "info";
/** Anciens noms, conservés comme alias : indigo → info, green → ok, amber → warn, gray → neutral, red → err. */
type LegacyBadgeVariant = "indigo" | "green" | "amber" | "gray" | "red";
type BadgeVariant = BadgeTone | LegacyBadgeVariant;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  err: "bg-err-soft text-err border-transparent",
  neutral: "bg-transparent text-ink-2 border-line-2",
  info: "bg-primary-soft text-primary border-transparent",
};

export const BADGE_ALIASES: Record<LegacyBadgeVariant, BadgeTone> = {
  indigo: "info",
  green: "ok",
  amber: "warn",
  gray: "neutral",
  red: "err",
};

function resolveTone(variant: BadgeVariant): BadgeTone {
  return variant in BADGE_ALIASES ? BADGE_ALIASES[variant as LegacyBadgeVariant] : (variant as BadgeTone);
}

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
          BADGE_TONE_CLASSES[resolveTone(variant)],
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

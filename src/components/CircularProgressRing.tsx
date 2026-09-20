import type { ReactNode } from "react";

interface CircularProgressRingProps {
  /** Progression de 0 à 1 (bornée). */
  value: number;
  /** Diamètre en px. */
  size?: number;
  strokeWidth?: number;
  /** Couleur de l'arc (couleur CSS). */
  color?: string;
  /** Couleur du cercle de fond. */
  trackColor?: string;
  /**
   * `progressbar` (défaut) expose les valeurs ARIA (0-100) ;
   * `timer` est un simple libellé (compte à rebours, pas une progression).
   */
  role?: "progressbar" | "timer";
  /** Libellé accessible. */
  label: string;
  /** Contenu centré dans l'anneau (icône, temps…). Décoratif si `aria-hidden`. */
  children?: ReactNode;
  className?: string;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * Anneau de progression SVG générique : arc proportionnel à `value`, contenu au centre.
 * Utilisé pour le temps restant d'une question de quiz et pour la progression du podcast.
 * La transition de l'arc est désactivée sous `prefers-reduced-motion`.
 */
export function CircularProgressRing({
  value,
  size = 44,
  strokeWidth = 3,
  color = "#6366f1", // indigo-500
  trackColor = "#e5e7eb", // gray-200
  role = "progressbar",
  label,
  children,
  className = "",
}: CircularProgressRingProps) {
  const progress = clamp01(value);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ariaValues =
    role === "progressbar"
      ? { "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(progress * 100) }
      : {};

  return (
    <div
      role={role}
      aria-label={label}
      {...ariaValues}
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset,stroke] duration-300 ease-out motion-reduce:transition-none"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

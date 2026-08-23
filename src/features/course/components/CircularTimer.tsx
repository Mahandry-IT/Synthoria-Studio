"use client";

const STROKE_WIDTH = 3;
const SIZE = 44;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
}

/**
 * Cercle progressif SVG affichant le temps restant.
 * - Se vide proportionnellement au temps écoulé.
 * - Passe rouge quand timeLeft < 10s.
 * - Affiche le temps au centre (mm:ss ou ss).
 */
export function CircularTimer({ timeLeft, totalTime }: CircularTimerProps) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = timeLeft < 10;

  const strokeColor = isUrgent ? "#ef4444" : "#6366f1"; // red-500 : indigo-600

  const display =
    timeLeft >= 60
      ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
      : String(timeLeft);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="flex-shrink-0"
      role="timer"
      aria-label={`${timeLeft} secondes restantes`}
    >
      {/* Cercle de fond */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="#e5e7eb" /* gray-200 */
        strokeWidth={STROKE_WIDTH}
      />
      {/* Cercle de progression */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={strokeColor}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
      />
      {/* Texte central */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className={`text-[11px] font-mono font-semibold ${
          isUrgent ? "fill-red-500" : "fill-gray-700"
        }`}
      >
        {display}
      </text>
    </svg>
  );
}

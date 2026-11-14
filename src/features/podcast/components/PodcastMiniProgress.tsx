"use client";

import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { CircularProgressRing } from "@/components/CircularProgressRing";

interface PodcastMiniProgressProps {
  /** 0-100 */
  progress: number;
  label: string;
  failed: boolean;
  /** Rouvre le modal de progression. */
  onExpand: () => void;
}

/**
 * Badge flottant (bas de page) affiché quand le modal est réduit : même anneau en petit ;
 * un clic rouvre le modal. Placé à gauche du bouton « retour en haut ».
 */
export function PodcastMiniProgress({ progress, label, failed, onExpand }: PodcastMiniProgressProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={`Podcast : ${failed ? "échec" : `${label}, ${progress} %`}. Afficher le détail`}
      className="fixed bottom-6 right-20 z-40 flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-ink shadow-lift transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
    >
      <CircularProgressRing
        value={progress / 100}
        size={36}
        strokeWidth={3}
        color={failed ? "var(--err)" : "var(--accent)"}
        label="Progression du podcast"
      >
        <span aria-hidden="true" className={`flex ${failed ? "text-err" : "text-accent"}`}>
          <GraphicEqIcon sx={{ fontSize: 16 }} />
        </span>
      </CircularProgressRing>
      <span className="font-mono text-xs font-medium text-ink-2" aria-hidden="true">
        {failed ? "Podcast : échec" : `Podcast ${progress} %`}
      </span>
    </button>
  );
}

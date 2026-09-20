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
      className="fixed bottom-6 right-20 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-4 shadow-lg transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <CircularProgressRing
        value={progress / 100}
        size={36}
        strokeWidth={3}
        color={failed ? "#ef4444" : "#6366f1"}
        label="Progression du podcast"
      >
        <span aria-hidden="true" className={`flex ${failed ? "text-red-500" : "text-indigo-600"}`}>
          <GraphicEqIcon sx={{ fontSize: 16 }} />
        </span>
      </CircularProgressRing>
      <span className="text-xs font-medium text-gray-700" aria-hidden="true">
        {failed ? "Podcast : échec" : `Podcast ${progress} %`}
      </span>
    </button>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Détecte qu'un quiz en plein écran a été quitté (sortie du plein écran, changement d'onglet, perte
 * de focus) et déclenche `onViolation` dès le premier événement.
 *
 * Limite assumée : aucune API web ne signale un changement de bureau virtuel en tant que tel — en
 * pratique ce geste déclenche `blur`/`visibilitychange` sur la quasi-totalité des OS/navigateurs, ce
 * que ces trois écouteurs couvrent déjà indirectement. Un tricheur utilisant un second appareil
 * physique reste indétectable par nature : aucune techno web ne peut voir ça.
 */
export function useFullscreenAntiCheat(isActive: boolean, onViolation: (reason: string) => void): void {
  useEffect(() => {
    if (!isActive) return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) onViolation("Vous avez quitté le mode plein écran.");
    };
    const onVisibilityChange = () => {
      if (document.hidden) onViolation("Vous avez changé d'onglet.");
    };
    const onBlur = () => onViolation("La fenêtre du quiz a perdu le focus.");

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [isActive, onViolation]);
}

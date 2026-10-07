"use client";

import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

/**
 * Capteurs du glisser-déposer vers un dossier : un léger seuil (souris) ou un appui long
 * (tactile) avant d'activer le glisser, pour que clics et défilement restent possibles.
 */
export function useFolderDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
}

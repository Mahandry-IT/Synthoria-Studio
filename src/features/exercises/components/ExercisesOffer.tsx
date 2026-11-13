"use client";

import { useState, useSyncExternalStore } from "react";
import { useExercises } from "../hooks/useExercises";
import { useGenerateExercises } from "../hooks/useGenerateExercises";
import { acceptExercisesOffer, markExercisesPromptAsked, wasExercisesPromptAsked } from "../exercise.state";
import { GenerateExercisesDialog } from "./GenerateExercisesDialog";

interface ExercisesOfferProps {
  sessionId: string;
}

/**
 * Propose une seule fois par cours (mémorisé) de générer les exercices, si aucun n'existe encore.
 * « Non » (ou Échap) ne génère rien et mémorise le refus ; « Oui » lance la génération, mémorisée
 * seulement si elle est acceptée par le serveur (sinon la fenêtre reste), suivie dans l'onglet dédié.
 * À monter uniquement quand le cours et son quiz sont prêts.
 */
export function ExercisesOffer({ sessionId }: ExercisesOfferProps) {
  const { data } = useExercises(sessionId);
  const generate = useGenerateExercises(sessionId);
  const [dismissed, setDismissed] = useState(false);
  // Serveur : « déjà posée » (pas de fenêtre au rendu serveur) ; client : valeur mémorisée.
  const alreadyAsked = useSyncExternalStore(
    () => () => {},
    () => wasExercisesPromptAsked(sessionId),
    () => true,
  );

  if (dismissed || alreadyAsked || data?.status !== "absent") return null;

  const close = () => {
    markExercisesPromptAsked(sessionId);
    setDismissed(true);
  };

  // « Posée » seulement après succès : sur 409/429/erreur réseau, la fenêtre reste ouverte pour réessayer ou refuser.
  const accept = () => {
    void acceptExercisesOffer(() => generate.mutateAsync(), close);
  };

  return (
    <GenerateExercisesDialog
      loading={generate.isPending}
      onDecline={close}
      onAccept={accept}
    />
  );
}

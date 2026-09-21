"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { RichText } from "../RichText";

interface ChallengeCardProps {
  challenge: string;
  /** Appelé quand l'apprenant a tenté une réponse ou choisi « je ne sais pas » : déverrouille l'explication. */
  onUnlock: () => void;
}

/** Défi posé avant l'explication : prédiction ou cas concret, réponse libre facultative. */
export function ChallengeCard({ challenge, onUnlock }: ChallengeCardProps) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">Défi</p>
      <RichText text={challenge} className="font-medium text-gray-900" />
      <label className="mt-3 block text-xs text-gray-600" htmlFor="challenge-answer">
        Votre réponse ou votre prédiction (elle reste sur votre appareil)
      </label>
      <textarea
        id="challenge-answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={2}
        maxLength={1000}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={answer.trim().length === 0} onClick={onUnlock}>
          Voir l&apos;explication
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onUnlock}>
          Je ne sais pas
        </Button>
      </div>
    </div>
  );
}

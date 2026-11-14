"use client";

import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { CONTROL_CLASSES } from "@/components/Input";
import { CHALLENGE_ANSWER_MAX_LENGTH } from "@/shared/utils/constants";
import { cx } from "@/shared/utils/cx";
import type { ChallengeResponse } from "../../course.types";
import { useChallengeFeedback } from "../../hooks/useChallengeFeedback";
import { RichText } from "../RichText";

/** Le verdict est porté par le libellé ; la couleur (encadré + filet) ne fait que le souligner. */
const VERDICT_STYLES: Record<ChallengeResponse["verdict"], { box: string; head: string; label: string }> = {
  on_track: { box: "border-ok bg-ok-soft", head: "text-ok", label: "Bonne piste !" },
  partial: { box: "border-warn bg-warn-soft", head: "text-warn", label: "En partie — il manque encore quelque chose" },
  off_track: { box: "border-err bg-err-soft", head: "text-err", label: "Pas tout à fait — l'explication va t'aider" },
};

interface ChallengeCardProps {
  challenge: string;
  /** Session persistée et id de section : activent l'analyse IA. Absents → aucune analyse ni envoi. */
  sessionId?: string | null;
  sectionId?: string;
  /** Défi déjà relevé (l'étape suivante est dépliée) : plus d'actions, le retour reste lisible. */
  answered?: boolean;
  /** Passe à l'explication (après le retour, « je ne sais pas » ou sans analyse possible). */
  onContinue: () => void;
}

/**
 * Défi posé avant l'explication. Avec une session persistée, la réponse est envoyée au serveur pour
 * être analysée par l'IA (verdict + conseil, sans révéler l'explication) ; « Je ne sais pas »
 * déverrouille l'explication sans appel ni envoi. Sans session, la réponse n'est jamais envoyée.
 */
export function ChallengeCard({ challenge, sessionId, sectionId, answered = false, onContinue }: ChallengeCardProps) {
  const [answer, setAnswer] = useState("");
  const analysis = useChallengeFeedback();
  const answerId = useId();
  const helpId = useId();
  const canAnalyze = Boolean(sessionId && sectionId);
  const result = analysis.data;
  const style = result ? VERDICT_STYLES[result.verdict] : null;
  const isEmpty = answer.trim().length === 0;
  const isOverLimit = answer.length > CHALLENGE_ANSWER_MAX_LENGTH;
  const locked = answered || Boolean(result) || analysis.isPending;

  const submit = () => {
    if (!canAnalyze || !sessionId || !sectionId) {
      onContinue();
      return;
    }
    analysis.mutate({ sessionId, sectionId, answer });
  };

  return (
    <div className="rounded-card border-l-[3px] border-accent bg-primary-soft p-4 text-sm text-ink">
      <p className="kicker mb-1 font-semibold text-primary">Défi</p>
      <RichText text={challenge} className="font-medium text-ink" />

      {!(answered && isEmpty) && (
        <>
          <label className="mt-3 block text-xs text-ink-2" htmlFor={answerId}>
            Votre réponse ou votre prédiction
          </label>
          <textarea
            id={answerId}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            maxLength={CHALLENGE_ANSWER_MAX_LENGTH}
            readOnly={locked}
            aria-describedby={helpId}
            className={cx(CONTROL_CLASSES, "mt-1 block w-full py-2 read-only:bg-sunken")}
          />
          <p id={helpId} className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-ink-2">
            <span>
              {canAnalyze
                ? "En validant, votre réponse est envoyée au serveur pour être analysée par l'IA (elle n'est pas enregistrée). « Je ne sais pas » n'envoie rien."
                : "Analyse indisponible pour ce cours : votre réponse n'est pas envoyée."}
            </span>
            <span className={isOverLimit ? "font-medium text-err" : ""}>
              {answer.length}/{CHALLENGE_ANSWER_MAX_LENGTH}
            </span>
          </p>
        </>
      )}

      {result && style && (
        <div role="status" className={`mt-3 rounded-card border-l-[3px] p-3 text-ink ${style.box}`}>
          <p className={`font-semibold ${style.head}`}>{style.label}</p>
          <p className="mt-1">{result.feedback}</p>
          {result.hint && (
            <p className="mt-2">
              <span className="font-medium">Piste : </span>
              {result.hint}
            </p>
          )}
        </div>
      )}

      {!answered && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result ? (
            <Button type="button" size="sm" onClick={onContinue}>
              Continuer
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                loading={analysis.isPending}
                disabled={isEmpty || isOverLimit}
                onClick={submit}
              >
                {canAnalyze ? "Valider ma réponse" : "Voir l'explication"}
              </Button>
              {analysis.isError && (
                <Button type="button" size="sm" variant="secondary" onClick={onContinue}>
                  Continuer sans analyse
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" disabled={analysis.isPending} onClick={onContinue}>
                Je ne sais pas
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

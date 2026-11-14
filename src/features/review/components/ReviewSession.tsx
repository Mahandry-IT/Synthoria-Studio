"use client";

import { useState } from "react";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/ButtonLink";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ProgressBar } from "@/components/ProgressBar";
import { Skeleton } from "@/components/Skeleton";
import { RichText } from "@/features/course/components/RichText";
import { boxLabel, boxToDelay, cardPositionLabel, resolveCardMode, summarizeReview } from "../review.logic";
import type { ReviewResult } from "../review.schema";
import { DUE_CARDS_KEY, useDueCards, useRecordReview } from "../hooks/useReview";
import { ReviewBoxes } from "./ReviewBoxes";
import { ReviewChoiceCard } from "./ReviewChoiceCard";
import { ReviewFreeTextCard } from "./ReviewFreeTextCard";

/** Ton du badge de boîte : warn (à revoir bientôt) → neutral (en cours) → ok (maîtrisée). */
function boxBadgeVariant(box: number): "warn" | "neutral" | "ok" {
  if (box <= 0) return "warn";
  if (box >= 3) return "ok";
  return "neutral";
}

/**
 * Session de révision, une carte à la fois, en mode mixte :
 * - QCM : choisir puis « Valider », correction immédiate et résultat envoyé automatiquement ;
 * - réponse libre : écrire sa réponse, « Voir la correction », puis « Je savais » / « À revoir ».
 * Le résultat de chaque carte est enregistré immédiatement ; le bilan s'affiche à la fin.
 */
export function ReviewSession() {
  const { data, isLoading, error, refetch } = useDueCards();
  const record = useRecordReview();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ReviewResult[]>([]);
  // Résultat enregistré de la carte QCM courante (en attente de « Carte suivante »)
  const [recorded, setRecorded] = useState(false);

  if (isLoading) {
    return (
      <Card className="space-y-5 p-6" aria-busy="true">
        <Skeleton lines={1} className="w-1/3" />
        <Skeleton lines={3} />
        <Skeleton lines={2} />
      </Card>
    );
  }
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const cards = data?.cards ?? [];
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<EventAvailableIcon fontSize="small" />}
        title="Rien à réviser aujourd'hui. Revenez demain !"
        action={
          <ButtonLink href="/ask" variant="secondary">
            Générer un cours
          </ButtonLink>
        }
      />
    );
  }

  if (index >= cards.length) {
    const summary = summarizeReview(results);
    return (
      <Card className="space-y-4 p-6 text-center sm:p-10" role="status">
        <p className="kicker">Session terminée</p>
        <p className="num text-[clamp(4.5rem,20vw,8.5rem)] text-primary">{summary.percent} %</p>
        <p className="mx-auto max-w-md text-sm text-ink-2">
          {summary.correct}/{summary.total} cartes sues ({summary.percent} %). Les cartes ratées reviennent demain ; les cartes sues reviendront plus tard sous une autre formulation.
        </p>
        <ButtonLink
          href="/"
          onClick={() => queryClient.invalidateQueries({ queryKey: [DUE_CARDS_KEY] })}
          className="w-full sm:w-auto"
        >
          Retour au tableau de bord
        </ButtonLink>
      </Card>
    );
  }

  const card = cards[index];
  const mode = resolveCardMode(card);

  const goNext = () => {
    setRecorded(false);
    setIndex((current) => current + 1);
  };

  /** Enregistre le résultat ; `advance` passe directement à la carte suivante (réponse libre). */
  const recordResult = (result: ReviewResult, advance: boolean) =>
    record.mutate(
      { sessionId: card.session_id, cardId: card.card_id, result },
      {
        onSuccess: () => {
          setResults((current) => [...current, result]);
          if (advance) goNext();
          else setRecorded(true);
        },
      },
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
      <Card className="min-w-0 space-y-5 p-5 sm:p-7">
        <div className="space-y-2">
          <p className="kicker">{cardPositionLabel(index, cards.length)}</p>
          <ProgressBar value={index} max={cards.length} label="Progression de la série" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {card.course_title && <Badge variant="info">{card.course_title}</Badge>}
          <Badge variant={boxBadgeVariant(card.box)}>{boxLabel(card.box)}</Badge>
          <span className="font-mono text-xs text-ink-3">{boxToDelay(card.box)}</span>
          <Badge variant="neutral">{mode === "qcm" ? "QCM" : "Réponse libre"}</Badge>
        </div>

        <div>
          <p className="kicker">Question</p>
          <RichText text={card.front} className="mt-2 block font-serif text-[clamp(1.375rem,4vw,2rem)] leading-snug text-ink" />
        </div>

        <div className="border-t border-line pt-5">
          {mode === "qcm" ? (
            <ReviewChoiceCard
              key={`${card.session_id}:${card.card_id}:${index}`}
              card={card}
              recording={record.isPending}
              recorded={recorded}
              onValidate={(result) => recordResult(result, false)}
              onNext={goNext}
            />
          ) : (
            <ReviewFreeTextCard
              key={`${card.session_id}:${card.card_id}:${index}`}
              card={card}
              recording={record.isPending}
              onAnswer={(result) => recordResult(result, true)}
            />
          )}
        </div>
      </Card>
      <aside aria-label="Boîtes de révision" className="min-w-0">
        <ReviewBoxes cards={cards} currentBox={card.box} />
      </aside>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { RichText } from "@/features/course/components/RichText";
import { boxLabel, resolveCardMode, summarizeReview } from "../review.logic";
import type { ReviewResult } from "../review.schema";
import { DUE_CARDS_KEY, useDueCards, useRecordReview } from "../hooks/useReview";
import { ReviewChoiceCard } from "./ReviewChoiceCard";
import { ReviewFreeTextCard } from "./ReviewFreeTextCard";

/** Couleur du badge de boîte : amber (à revoir bientôt) → gray (en cours) → green (maîtrisée). */
function boxBadgeVariant(box: number): "amber" | "gray" | "green" {
  if (box <= 0) return "amber";
  if (box >= 3) return "green";
  return "gray";
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

  if (isLoading) return <Skeleton lines={4} />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const cards = data?.cards ?? [];
  if (cards.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-gray-600">Rien à réviser aujourd&apos;hui. Revenez demain !</p>
        <Link href="/ask" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
          Générer un cours
        </Link>
      </Card>
    );
  }

  if (index >= cards.length) {
    const summary = summarizeReview(results);
    return (
      <Card className="space-y-3 p-6 text-center" role="status">
        <p className="text-lg font-semibold text-gray-900">Session terminée</p>
        <p className="text-sm text-gray-600">
          {summary.correct}/{summary.total} cartes sues ({summary.percent} %). Les cartes ratées reviennent demain ; les cartes sues reviendront plus tard sous une autre formulation.
        </p>
        <Link
          href="/"
          onClick={() => queryClient.invalidateQueries({ queryKey: [DUE_CARDS_KEY] })}
          className="inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Retour au tableau de bord
        </Link>
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
    <Card className="space-y-5 p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
          <span>
            Carte {index + 1}/{cards.length}
          </span>
          <span>{Math.round((index / cards.length) * 100)} %</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(index / cards.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {card.course_title && <Badge variant="indigo">{card.course_title}</Badge>}
        <Badge variant={boxBadgeVariant(card.box)}>{boxLabel(card.box)}</Badge>
        <Badge variant="gray">{mode === "qcm" ? "QCM" : "Réponse libre"}</Badge>
      </div>

      <div>
        <RichText text={card.front} className="text-base font-medium leading-relaxed text-gray-900" />
      </div>

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
    </Card>
  );
}

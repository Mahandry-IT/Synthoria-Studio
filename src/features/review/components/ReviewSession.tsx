"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { RichText } from "@/features/course/components/RichText";
import { boxLabel, splitBack, summarizeReview } from "../review.logic";
import type { ReviewResult } from "../review.schema";
import { DUE_CARDS_KEY, useDueCards, useRecordReview } from "../hooks/useReview";

/** Couleur du badge de boîte : amber (à revoir bientôt) → gray (en cours) → green (maîtrisée). */
function boxBadgeVariant(box: number): "amber" | "gray" | "green" {
  if (box <= 0) return "amber";
  if (box >= 3) return "green";
  return "gray";
}

/**
 * Session de révision : une carte à la fois (question → « Voir la réponse » → « Je savais » / « À revoir »).
 * Le résultat de chaque carte est enregistré immédiatement ; le bilan s'affiche à la fin.
 */
export function ReviewSession() {
  const { data, isLoading, error, refetch } = useDueCards();
  const record = useRecordReview();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);

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
          {summary.correct}/{summary.total} cartes sues ({summary.percent} %). Les cartes ratées reviennent demain.
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
  const { answer, explanation } = splitBack(card.back);

  const answerCard = (result: ReviewResult) =>
    record.mutate(
      { sessionId: card.session_id, cardId: card.card_id, result },
      {
        onSuccess: () => {
          setResults((current) => [...current, result]);
          setRevealed(false);
          setIndex((current) => current + 1);
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
      </div>

      <div>
        <RichText text={card.front} className="text-base font-medium leading-relaxed text-gray-900" />
      </div>

      {!revealed ? (
        <Button type="button" className="w-full sm:w-auto" onClick={() => setRevealed(true)}>
          Voir la réponse
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">Réponse</p>
            <RichText text={answer} className="font-semibold" />
            {explanation && <RichText text={explanation} className="mt-2 opacity-80" />}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="flex-1"
              loading={record.isPending}
              onClick={() => answerCard("correct")}
            >
              Je savais
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              loading={record.isPending}
              onClick={() => answerCard("incorrect")}
            >
              À revoir
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

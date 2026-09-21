"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { RichText } from "@/features/course/components/RichText";
import { boxLabel, splitBack, summarizeReview } from "../review.logic";
import type { ReviewResult } from "../review.schema";
import { DUE_CARDS_KEY, useDueCards, useRecordReview } from "../hooks/useReview";

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
          href="/dashboard"
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
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          Carte {index + 1}/{cards.length}
        </span>
        <span>
          {card.course_title ? `${card.course_title} · ` : ""}
          {boxLabel(card.box)}
        </span>
      </div>

      <RichText text={card.front} className="text-base font-medium text-gray-900" />

      {!revealed ? (
        <Button type="button" onClick={() => setRevealed(true)}>
          Voir la réponse
        </Button>
      ) : (
        <>
          <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-900">
            <RichText text={answer} className="font-semibold" />
            {explanation && <RichText text={explanation} className="mt-2 opacity-80" />}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" loading={record.isPending} onClick={() => answerCard("correct")}>
              Je savais
            </Button>
            <Button type="button" variant="outline" loading={record.isPending} onClick={() => answerCard("incorrect")}>
              À revoir
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

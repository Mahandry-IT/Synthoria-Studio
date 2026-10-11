"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { CourseGenerationResponse, RegenerateIncompleteSectionsResponse } from "../../course.types";
import { useRegenerateCourse } from "../../hooks/useRegenerateCourse";
import { useRegenerateIncompleteSections } from "../../hooks/useRegenerateIncompleteSections";

interface IncompleteCourseBannerProps {
  sessionId: string;
  /** Sections encore incomplètes (régénérations déjà appliquées prises en compte). */
  incompleteCount: number;
  /** Cours livré sans résumé ou sans quiz : seule une régénération complète le répare. */
  missingWrapUp: boolean;
  onSectionsRegenerated: (result: RegenerateIncompleteSectionsResponse) => void;
  onCourseRegenerated: (course: CourseGenerationResponse) => void;
}

/**
 * Bandeau d'un cours incomplet : relancer d'un coup toutes les sections incomplètes, ou régénérer
 * le cours entier (après confirmation : le quiz et les flashcards repartent de zéro). Le bouton
 * « Régénérer cette section » de chaque section reste disponible.
 */
export function IncompleteCourseBanner({
  sessionId,
  incompleteCount,
  missingWrapUp,
  onSectionsRegenerated,
  onCourseRegenerated,
}: IncompleteCourseBannerProps) {
  const [confirming, setConfirming] = useState(false);
  const sections = useRegenerateIncompleteSections(onSectionsRegenerated);
  const course = useRegenerateCourse((regenerated) => {
    setConfirming(false);
    onCourseRegenerated(regenerated);
  });

  if (incompleteCount === 0 && !missingWrapUp) return null;

  const busy = sections.isPending || course.isPending;
  const problems = [
    incompleteCount > 0 &&
      `${incompleteCount} ${incompleteCount > 1 ? "sections sont incomplètes" : "section est incomplète"}`,
    missingWrapUp && "le résumé ou le quiz du cours n'a pas été généré",
  ].filter(Boolean);

  return (
    <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">⚠️ Cours incomplet</p>
      <p className="mt-1">{problems.join(" et ")} : la génération a échoué (erreur temporaire).</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {incompleteCount > 0 && (
          <Button
            type="button"
            size="sm"
            loading={sections.isPending}
            disabled={busy}
            onClick={() => sections.mutate(sessionId)}
          >
            Régénérer les sections incomplètes
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfirming(true)}>
          Régénérer le cours
        </Button>
      </div>
      {sections.isPending && (
        <p className="mt-2 text-xs" aria-live="polite">
          Régénération en cours, une section à la fois : cela peut prendre plusieurs minutes.
        </p>
      )}

      {confirming && (
        <ConfirmDialog
          title="Régénérer tout le cours ?"
          description="Le contenu de toutes les sections sera réécrit, en gardant leurs titres et vos notes. Le quiz et les flashcards repartiront de zéro. Cela peut prendre plusieurs minutes."
          confirmLabel="Régénérer le cours"
          loading={course.isPending}
          onConfirm={() => course.mutate(sessionId)}
          onClose={() => {
            if (!course.isPending) setConfirming(false);
          }}
        />
      )}
    </div>
  );
}

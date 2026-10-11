"use client";

import { Button } from "@/components/Button";
import type { CourseSection } from "../../course.types";
import { useRegenerateSection } from "../../hooks/useRegenerateSection";

interface RegenerateSectionButtonProps {
  sessionId: string;
  sectionId: string;
  /** Appelé avec la section régénérée en cas de succès. */
  onRegenerated: (section: CourseSection) => void;
  /** Une régénération groupée traite déjà cette section : le bouton est désactivé le temps qu'elle finisse. */
  locked?: boolean;
}

/** Affiché à la place du contenu d'une section marquée `incomplete` : régénère cette section seule. */
export function RegenerateSectionButton({
  sessionId,
  sectionId,
  onRegenerated,
  locked = false,
}: RegenerateSectionButtonProps) {
  const regenerate = useRegenerateSection(onRegenerated);

  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">⚠️ Section incomplète</p>
      <p className="mt-1">La génération de son contenu a échoué (erreur temporaire).</p>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        loading={regenerate.isPending}
        disabled={locked}
        onClick={() => regenerate.mutate({ sessionId, sectionId })}
      >
        Régénérer cette section
      </Button>
      {locked && (
        <p className="mt-2 text-xs" aria-live="polite">
          Une régénération de toutes les sections incomplètes est en cours : cette section sera traitée avec les autres.
        </p>
      )}
    </div>
  );
}

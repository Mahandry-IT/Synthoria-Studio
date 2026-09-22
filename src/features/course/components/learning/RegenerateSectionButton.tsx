"use client";

import { Button } from "@/components/Button";
import type { CourseSection } from "../../course.types";
import { useRegenerateSection } from "../../hooks/useRegenerateSection";

interface RegenerateSectionButtonProps {
  sessionId: string;
  sectionId: string;
  /** Appelé avec la section régénérée en cas de succès. */
  onRegenerated: (section: CourseSection) => void;
}

/** Affiché à la place du contenu d'une section marquée `incomplete` : régénère cette section seule. */
export function RegenerateSectionButton({ sessionId, sectionId, onRegenerated }: RegenerateSectionButtonProps) {
  const regenerate = useRegenerateSection();

  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">⚠️ Section incomplète</p>
      <p className="mt-1">La génération de son contenu a échoué (erreur temporaire).</p>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        loading={regenerate.isPending}
        onClick={() =>
          regenerate.mutate({ sessionId, sectionId }, { onSuccess: onRegenerated })
        }
      >
        Régénérer cette section
      </Button>
    </div>
  );
}

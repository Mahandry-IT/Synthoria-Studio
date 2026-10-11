import type {
  CourseGenerationResponse,
  CourseSection,
  RegenerateIncompleteSectionsResponse,
} from "./course.types";

/** Nombre de sections marquées `incomplete` (génération en échec, à relancer). */
export function countIncompleteSections(sections: readonly CourseSection[]): number {
  return sections.filter((section) => section.incomplete).length;
}

/**
 * Vrai si le cours a été livré sans sa clôture (résumé ou quiz absent) : seul un cours généré avant
 * que le serveur ne la rende obligatoire peut être dans ce cas, et seule une régénération complète
 * la lui rend.
 */
export function isMissingWrapUp(course: Pick<CourseGenerationResponse, "summary" | "quiz">): boolean {
  return !course.summary?.trim() || !course.quiz?.length;
}

export interface RegenerationOutcome {
  kind: "success" | "warning";
  message: string;
}

const plural = (count: number, singular: string, pluralForm: string) => (count > 1 ? pluralForm : singular);

/** Message de fin d'une régénération groupée : ce qui a réussi, ce qui reste et pourquoi. */
export function describeRegeneration(result: RegenerateIncompleteSectionsResponse): RegenerationOutcome {
  const done = result.regenerated.length;
  const left = result.failed.length + result.remaining_section_ids.length;
  const doneText =
    done > 0
      ? `${done} ${plural(done, "section régénérée", "sections régénérées")}`
      : "Aucune section n'a pu être régénérée";

  if (left === 0) return { kind: "success", message: `${doneText}.` };

  const leftText = `${left} ${plural(left, "section reste incomplète", "sections restent incomplètes")}`;
  const reasons: Record<NonNullable<RegenerateIncompleteSectionsResponse["stopped_reason"]>, string> = {
    quota: "quota du moteur IA atteint, réessayez plus tard",
    unavailable: "moteur IA indisponible, réessayez plus tard",
    limit: "relancez pour continuer",
  };
  const reason = result.stopped_reason ? reasons[result.stopped_reason] : "relancez-les";
  return { kind: "warning", message: `${doneText}. ${leftText} : ${reason}.` };
}

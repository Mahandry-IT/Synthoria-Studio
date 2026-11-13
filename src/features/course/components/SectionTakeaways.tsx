import { LatexText } from "@/shared/utils/latex";
import type { CourseSection } from "../course.types";

interface SectionTakeawaysProps {
  section: Pick<CourseSection, "key_takeaways" | "pitfalls_to_avoid">;
  /** Préfixe d'id DOM unique (liaison aria-labelledby). */
  idPrefix: string;
}

const clean = (items: string[] | undefined): string[] => (items ?? []).map((t) => t.trim()).filter(Boolean);

/** Erreurs exploitables : au moins le texte de l'erreur. */
const cleanPitfalls = (items: CourseSection["pitfalls_to_avoid"]) =>
  (items ?? []).filter((p) => p.mistake?.trim()).map((p) => ({ mistake: p.mistake.trim(), how: p.how_to_avoid?.trim() ?? "" }));

/** Vrai si la section a au moins un encadré à afficher (cours antérieurs au lot 2 : faux). */
export function hasSectionTakeaways(section: SectionTakeawaysProps["section"]): boolean {
  return clean(section.key_takeaways).length > 0 || cleanPitfalls(section.pitfalls_to_avoid).length > 0;
}

/**
 * Encadrés de fin de section : « Ce qu'il faut retenir » et « Ce qu'il faut éviter ».
 * Les textes viennent du modèle : rendus comme texte (jamais en HTML), formules via `LatexText`.
 * Un encadré vide n'est pas affiché.
 */
export function SectionTakeaways({ section, idPrefix }: SectionTakeawaysProps) {
  const takeaways = clean(section.key_takeaways);
  const pitfalls = cleanPitfalls(section.pitfalls_to_avoid);
  if (takeaways.length === 0 && pitfalls.length === 0) return null;

  const retainId = `${idPrefix}-retain`;
  const avoidId = `${idPrefix}-avoid`;
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {takeaways.length > 0 && (
        <section aria-labelledby={retainId} className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <h4 id={retainId} className="text-sm font-semibold text-indigo-900">
            Ce qu&apos;il faut retenir
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-indigo-900">
            {takeaways.map((text, i) => (
              <li key={i}>
                <LatexText text={text} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {pitfalls.length > 0 && (
        <section aria-labelledby={avoidId} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 id={avoidId} className="text-sm font-semibold text-amber-900">
            Ce qu&apos;il faut éviter
          </h4>
          <ul className="mt-2 space-y-3 text-sm text-amber-900">
            {pitfalls.map((pitfall, i) => (
              <li key={i}>
                <p className="font-medium">
                  <LatexText text={pitfall.mistake} />
                </p>
                {pitfall.how && (
                  <p className="mt-1">
                    <span className="font-medium">Comment l&apos;éviter :</span> <LatexText text={pitfall.how} />
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

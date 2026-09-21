import type { EditableSection } from "./planEditing";
import type { PretestItem } from "./course.types";
import { isAnswerCorrect } from "./quizGrading";

const norm = (title: string) => title.trim().toLowerCase();

/** Réponse à une question : ensemble des indices d'options cochés. */
export type PretestAnswers = Record<string, number[]>;

/** Une question du pré-test est réussie si les indices choisis sont exactement les bonnes réponses. */
export function isCorrect(item: PretestItem, selected: number[]): boolean {
  return isAnswerCorrect(item.question, selected);
}

/** Titres (normalisés) des sections dont la question du pré-test est réussie. */
export function masteredTitles(pretest: PretestItem[], answers: PretestAnswers): Set<string> {
  return new Set(
    pretest.filter((item) => isCorrect(item, answers[item.section_title] ?? [])).map((item) => norm(item.section_title)),
  );
}

/**
 * Marque « déjà maîtrisée » les sections de développement dont le titre est dans `mastered` ;
 * lève la marque pour les autres (un pré-test refait remplace le précédent). Les autres types
 * de sections ne sont jamais concernés.
 */
export function applyMastery(sections: EditableSection[], mastered: Set<string>): EditableSection[] {
  return sections.map((s) =>
    s.type !== "development" ? s : { ...s, mastery: mastered.has(norm(s.title)) ? "known" : null },
  );
}

/** Pré-test utilisable : questions dont la section existe encore dans le plan (édité par l'utilisateur). */
export function relevantPretest(pretest: PretestItem[], sections: EditableSection[]): PretestItem[] {
  const titles = new Set(sections.filter((s) => s.type === "development").map((s) => norm(s.title)));
  return pretest.filter((item) => titles.has(norm(item.section_title)));
}

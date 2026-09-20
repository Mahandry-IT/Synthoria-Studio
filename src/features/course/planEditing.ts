import {
  COURSE_PLAN_MAX_SECTIONS,
  PLAN_OBJECTIVE_MAX_LENGTH,
  PLAN_SUBTOPIC_MAX_LENGTH,
  PLAN_SUBTOPICS_MAX_ITEMS,
  PLAN_TITLE_MAX_LENGTH,
} from "@/shared/utils/constants";
import type { PlannedSection, PlannedSectionType } from "./course.types";

/**
 * Section de plan en cours d'édition.
 * `key` est un identifiant client stable (clé React) ; les sous-thèmes sont
 * édités comme texte brut (une ligne = un sous-thème) pour ne pas perdre les
 * retours à la ligne pendant la saisie.
 */
export interface EditableSection {
  key: string;
  type: PlannedSectionType;
  title: string;
  objective: string;
  subtopicsText: string;
}

export const SECTION_TYPE_LABELS: Record<PlannedSectionType, string> = {
  introduction: "Introduction",
  development: "Développement",
  common_pitfalls: "Pièges courants",
  summary: "Résumé",
  next_steps: "Pour aller plus loin",
};

let keySequence = 0;
const nextKey = (): string => `plan-section-${++keySequence}`;

const splitSubtopics = (text: string): string[] =>
  text.split("\n").map((line) => line.trim()).filter(Boolean);

/** Convertit le plan reçu du backend en sections éditables. */
export function toEditable(sections: PlannedSection[]): EditableSection[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      key: nextKey(),
      type: s.type,
      title: s.title,
      objective: s.objective,
      subtopicsText: s.subtopics.join("\n"),
    }));
}

/** Section vierge de type développement (le titre doit être renseigné avant validation). */
export function createBlankSection(): EditableSection {
  return { key: nextKey(), type: "development", title: "", objective: "", subtopicsText: "" };
}

export function updateSection(
  sections: EditableSection[],
  key: string,
  patch: Partial<Omit<EditableSection, "key">>,
): EditableSection[] {
  return sections.map((s) => (s.key === key ? { ...s, ...patch } : s));
}

export function removeSection(sections: EditableSection[], key: string): EditableSection[] {
  return sections.filter((s) => s.key !== key);
}

/** Insère `section` juste après `afterKey` (ou en fin de liste si `afterKey` est omis/inconnu). */
export function insertSection(
  sections: EditableSection[],
  section: EditableSection,
  afterKey?: string,
): EditableSection[] {
  const index = afterKey ? sections.findIndex((s) => s.key === afterKey) : -1;
  if (index === -1) return [...sections, section];
  return [...sections.slice(0, index + 1), section, ...sections.slice(index + 1)];
}

/** Déplace une section de `delta` positions (bornée aux extrémités de la liste). */
export function moveSection(
  sections: EditableSection[],
  key: string,
  delta: -1 | 1,
): EditableSection[] {
  const from = sections.findIndex((s) => s.key === key);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= sections.length) return sections;
  const next = [...sections];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Erreurs bloquantes pour la validation (mêmes règles que le backend). Vide = plan valide. */
export function validatePlan(sections: EditableSection[]): string[] {
  const errors: string[] = [];

  if (sections.length === 0) errors.push("Le plan doit contenir au moins une section.");
  if (sections.length > COURSE_PLAN_MAX_SECTIONS) {
    errors.push(`Un plan ne peut pas dépasser ${COURSE_PLAN_MAX_SECTIONS} sections.`);
  }
  if (sections.length > 0 && !sections.some((s) => s.type === "development")) {
    errors.push("Le plan doit contenir au moins une section de développement.");
  }

  sections.forEach((s, i) => {
    const position = i + 1;
    const subtopics = splitSubtopics(s.subtopicsText);
    if (s.title.trim().length === 0) errors.push(`Section ${position} : le titre est obligatoire.`);
    if (s.title.trim().length > PLAN_TITLE_MAX_LENGTH) {
      errors.push(`Section ${position} : titre trop long (${PLAN_TITLE_MAX_LENGTH} caractères max).`);
    }
    if (s.objective.trim().length > PLAN_OBJECTIVE_MAX_LENGTH) {
      errors.push(`Section ${position} : objectif trop long (${PLAN_OBJECTIVE_MAX_LENGTH} caractères max).`);
    }
    if (subtopics.length > PLAN_SUBTOPICS_MAX_ITEMS) {
      errors.push(`Section ${position} : ${PLAN_SUBTOPICS_MAX_ITEMS} sous-thèmes maximum.`);
    }
    if (subtopics.some((t) => t.length > PLAN_SUBTOPIC_MAX_LENGTH)) {
      errors.push(`Section ${position} : sous-thème trop long (${PLAN_SUBTOPIC_MAX_LENGTH} caractères max).`);
    }
  });

  return errors;
}

/** Convertit les sections éditées en payload backend : trim, sous-thèmes non vides, `order` consécutif. */
export function toPlannedSections(sections: EditableSection[]): PlannedSection[] {
  return sections.map((s, i) => ({
    type: s.type,
    title: s.title.trim(),
    objective: s.objective.trim(),
    subtopics: splitSubtopics(s.subtopicsText),
    order: i + 1,
  }));
}

/**
 * Comme `toPlannedSections`, mais pour les requêtes d'assistance IA : le plan peut encore
 * contenir des sections sans titre (le backend exige un titre), qu'on nomme provisoirement.
 */
export function toAssistSections(sections: EditableSection[]): PlannedSection[] {
  return toPlannedSections(sections).map((s) => (s.title ? s : { ...s, title: `Section ${s.order} (sans titre)` }));
}

/** Champs d'édition correspondant à une section complétée par l'IA (le type de la section est conservé). */
export function toSectionPatch(refined: PlannedSection): Partial<Omit<EditableSection, "key">> {
  return {
    title: refined.title,
    objective: refined.objective,
    subtopicsText: refined.subtopics.join("\n"),
  };
}

/**
 * Insère de nouvelles sections de développement juste après la dernière section de
 * développement existante (à défaut, en fin de plan), sans dépasser le plafond du plan.
 */
export function insertGeneratedSections(
  sections: EditableSection[],
  generated: PlannedSection[],
): EditableSection[] {
  const capacity = Math.max(0, COURSE_PLAN_MAX_SECTIONS - sections.length);
  const added = toEditable(generated).slice(0, capacity);
  const lastDevelopment = sections.map((s) => s.type).lastIndexOf("development");
  const at = lastDevelopment === -1 ? sections.length : lastDevelopment + 1;
  return [...sections.slice(0, at), ...added, ...sections.slice(at)];
}

import type { CourseSection } from "./course.types";

/**
 * Progression de l'apprenant dans un cours, conservée en sessionStorage :
 * - `unlocked` : défis relevés (explication déverrouillée) ;
 * - `done` : sections terminées ;
 * - `current` : section affichée par le lecteur ;
 * - `revealed` : nombre d'étapes dévoilées par section (dévoilement progressif) ;
 * - `faded` : nombre d'étapes révélées de l'exemple à trous, par section.
 * Les trois derniers champs sont optionnels : une progression enregistrée avant leur ajout reste valide.
 */
export interface SectionProgress {
  unlocked: string[];
  done: string[];
  current?: string | null;
  revealed?: Record<string, number>;
  faded?: Record<string, number>;
}

export const EMPTY_PROGRESS: SectionProgress = { unlocked: [], done: [] };

const add = (list: string[], id: string): string[] => (list.includes(id) ? list : [...list, id]);

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/** Clé de progression d'une section : son id, à défaut sa position. */
export const sectionKey = (id: string | undefined, index: number): string => id ?? `#${index}`;

export function unlockSection(progress: SectionProgress, id: string): SectionProgress {
  return { ...progress, unlocked: add(progress.unlocked, id) };
}

/** Une section terminée est aussi déverrouillée (le « Vérifie » suppose que l'explication a été lue). */
export function completeSection(progress: SectionProgress, id: string): SectionProgress {
  return { ...progress, unlocked: add(progress.unlocked, id), done: add(progress.done, id) };
}

/** Explication visible : section sans défi, défi relevé, ou section déjà terminée. */
export function isExplanationVisible(progress: SectionProgress, id: string, hasChallenge: boolean): boolean {
  return !hasChallenge || progress.unlocked.includes(id) || progress.done.includes(id);
}

/** Une section est « terminée » quand son Vérifie est fait ; sans questions de vérification, on ne la suit pas. */
export function isTrackable(checkQuestionsCount: number): boolean {
  return checkQuestionsCount > 0;
}

// ─── Étapes du cycle et dévoilement progressif ──────────────

/** Étapes du cycle, dans l'ordre : défi → pourquoi → quoi → comment → à toi → vérifie → explique. */
export type LearningStepKind =
  | "challenge"
  | "pourquoi"
  | "quoi"
  | "comment"
  /** Sous-section au titre non standard : étape générique, dans l'ordre reçu. */
  | "generic"
  | "a_toi"
  | "verifie"
  | "explique";

export interface LearningStep {
  /** Unique dans la section (sert d'id DOM et de clé React). */
  key: string;
  kind: LearningStepKind;
  /** Index dans `section.subsections` pour les étapes d'explication. */
  subsectionIndex?: number;
}

const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^[\s\d.)-]+/, "")
    .trim();

/** Rôle d'une sous-section d'après son titre (« Pourquoi… », « Quoi… », « Comment… ») ; sinon générique. */
export function subsectionKind(title: string | undefined): "pourquoi" | "quoi" | "comment" | "generic" {
  const t = normalize(title ?? "");
  if (t.startsWith("pourquoi")) return "pourquoi";
  if (t.startsWith("comment")) return "comment";
  if (t.startsWith("quoi") || t.startsWith("qu'est-ce") || t.startsWith("qu’est-ce")) return "quoi";
  return "generic";
}

const hasBlocks = (section: Pick<CourseSection, "subsections">): boolean =>
  (section.subsections ?? []).some((s) => s.blocks.length > 0);

/**
 * Lecture progressive : section avec un défi et un contenu par blocs. Les sections historiques
 * (sans défi ni sous-sections) gardent l'affichage complet.
 */
export function isProgressive(section: Pick<CourseSection, "challenge" | "subsections">): boolean {
  return Boolean(section.challenge?.trim()) && hasBlocks(section);
}

/**
 * Étapes à dévoiler pour une section. Les sous-sections vides sont ignorées et gardent leur ordre ;
 * « Explique » n'existe que si la reformulation peut être évaluée (`canRecall` : session persistée).
 */
export function buildLearningSteps(
  section: Pick<CourseSection, "challenge" | "subsections" | "faded_example" | "check_questions" | "recall_prompt">,
  canRecall: boolean,
): LearningStep[] {
  const steps: LearningStep[] = [];
  if (section.challenge?.trim()) steps.push({ key: "challenge", kind: "challenge" });
  (section.subsections ?? []).forEach((sub, i) => {
    if (sub.blocks.length > 0) steps.push({ key: `sub-${i}`, kind: subsectionKind(sub.title), subsectionIndex: i });
  });
  const faded = section.faded_example;
  if (faded && ((faded.given_steps?.length ?? 0) > 0 || (faded.hidden_steps?.length ?? 0) > 0)) {
    steps.push({ key: "a_toi", kind: "a_toi" });
  }
  if ((section.check_questions?.length ?? 0) > 0) steps.push({ key: "verifie", kind: "verifie" });
  if (canRecall && section.recall_prompt) steps.push({ key: "explique", kind: "explique" });
  return steps;
}

/**
 * Nombre d'étapes dévoilées (au moins la première). Une section terminée est entièrement dévoilée ;
 * un défi relevé avant le lecteur progressif (`unlocked`) dévoile au moins l'étape suivante.
 */
export function revealedStepCount(progress: SectionProgress, id: string, total: number): number {
  if (total <= 0) return 0;
  if (progress.done.includes(id)) return total;
  const stored = progress.revealed?.[id] ?? (progress.unlocked.includes(id) ? 2 : 1);
  return clamp(stored, 1, total);
}

/** Dévoile l'étape suivante ; au-delà du défi, la section compte comme déverrouillée. */
export function revealNextStep(progress: SectionProgress, id: string, total: number): SectionProgress {
  if (total <= 0) return progress;
  const next = Math.min(revealedStepCount(progress, id, total) + 1, total);
  const updated = { ...progress, revealed: { ...progress.revealed, [id]: next } };
  return next >= 2 ? unlockSection(updated, id) : updated;
}

/** Toutes les étapes de la section sont dévoilées. */
export function isFullyRevealed(progress: SectionProgress, id: string, total: number): boolean {
  return revealedStepCount(progress, id, total) >= total;
}

// ─── Navigation entre sections ──────────────────────────────

export type SectionStatus = "done" | "in_progress" | "todo";

export function setCurrentSection(progress: SectionProgress, id: string): SectionProgress {
  return { ...progress, current: id };
}

/** Section courante : celle mémorisée si elle existe encore, sinon la première. */
export function resolveCurrentSection(progress: SectionProgress, keys: string[]): string | null {
  if (progress.current && keys.includes(progress.current)) return progress.current;
  return keys[0] ?? null;
}

/** Section voisine (`delta` = -1 précédente, +1 suivante), ou null en bout de liste. */
export function adjacentSection(keys: string[], current: string | null, delta: -1 | 1): string | null {
  const index = current === null ? -1 : keys.indexOf(current);
  if (index < 0) return null;
  return keys[index + delta] ?? null;
}

/** État d'une section dans la navigation : faite, en cours (commencée ou ouverte), à faire. */
export function sectionStatus(progress: SectionProgress, id: string): SectionStatus {
  if (progress.done.includes(id)) return "done";
  if (progress.current === id || progress.unlocked.includes(id) || (progress.revealed?.[id] ?? 0) > 1) {
    return "in_progress";
  }
  return "todo";
}

// ─── Exemple à trous (« À toi ») ────────────────────────────

/** Nombre d'étapes cachées déjà révélées dans l'exemple à trous. */
export function fadedRevealedCount(progress: SectionProgress, id: string, hiddenCount: number): number {
  return clamp(progress.faded?.[id] ?? 0, 0, Math.max(hiddenCount, 0));
}

export function revealFadedStep(progress: SectionProgress, id: string, hiddenCount: number): SectionProgress {
  const next = Math.min(fadedRevealedCount(progress, id, hiddenCount) + 1, Math.max(hiddenCount, 0));
  return { ...progress, faded: { ...progress.faded, [id]: next } };
}

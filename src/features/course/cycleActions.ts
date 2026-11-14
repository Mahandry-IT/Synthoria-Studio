import type { ClassifyCase, CourseTable, CycleCellRef, MatchPair } from "./course.types";

/** Résultat de vérification d'une action : `wrong` liste les éléments à reprendre (indices). */
export interface ActionResult {
  correct: boolean;
  wrong: number[];
}

const result = (wrong: number[]): ActionResult => ({ correct: wrong.length === 0, wrong });

// ─── Mélange stable (même rendu serveur et client, jamais l'ordre d'origine) ───

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Permutation de 0..n-1 déterminée par `seed`, jamais l'identité dès que n >= 2
 * (sinon l'exercice serait déjà résolu à l'affichage).
 */
export function stablePermutation(n: number, seed: string): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  const random = mulberry32(hashSeed(seed));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (n >= 2 && order.every((v, i) => v === i)) order.push(order.shift() as number);
  return order;
}

// ─── Remise dans l'ordre ───────────────────────────────────

/** Ordre initial affiché : indices de `order_items` (déjà dans le bon ordre), mélangés de façon stable. */
export const initialOrder = (items: readonly string[]): number[] => stablePermutation(items.length, items.join("|"));

/** Déplace l'élément à la position `from` de `delta` rang (-1 vers le haut, +1 vers le bas) ; sans effet hors bornes. */
export function moveItem(order: readonly number[], from: number, delta: -1 | 1): number[] {
  const to = from + delta;
  if (from < 0 || from >= order.length || to < 0 || to >= order.length) return [...order];
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** `wrong` : positions affichées dont l'élément n'est pas à sa place. */
export const checkOrder = (order: readonly number[]): ActionResult =>
  result(order.flatMap((item, position) => (item === position ? [] : [position])));

// ─── Classement ────────────────────────────────────────────

/** `assignment[i]` : catégorie choisie pour le cas i (null = non classé). `wrong` : cas faux ou non classés. */
export function checkClassify(cases: readonly ClassifyCase[], assignment: readonly (number | null)[]): ActionResult {
  return result(cases.flatMap((c, i) => (assignment[i] === c.category_index ? [] : [i])));
}

// ─── Association ───────────────────────────────────────────

export interface MatchSetup {
  /** Termes de droite, dans un ordre mélangé stable. */
  options: string[];
  /** Pour chaque paire (colonne de gauche), indice de sa bonne option dans `options`. */
  correct: number[];
}

export function buildMatch(pairs: readonly MatchPair[]): MatchSetup {
  const order = stablePermutation(pairs.length, pairs.map((p) => p.right).join("|"));
  return {
    options: order.map((i) => pairs[i].right),
    correct: pairs.map((_, i) => order.indexOf(i)),
  };
}

export function checkMatch(correct: readonly number[], given: readonly (number | null)[]): ActionResult {
  return result(correct.flatMap((expected, i) => (given[i] === expected ? [] : [i])));
}

// ─── Tableau à compléter ───────────────────────────────────

const norm = (s: string) => s.trim().toLowerCase();

/** Réponse attendue d'une case masquée (le tableau reçu du serveur est complet). */
export const blankAnswer = (table: CourseTable, blank: CycleCellRef): string => table.rows[blank.row]?.[blank.col] ?? "";

/** Choix proposés : bonnes réponses et leurres, sans doublon, ordre mélangé stable. */
export function fillChoices(table: CourseTable, blanks: readonly CycleCellRef[], distractors: readonly string[]): string[] {
  const seen = new Set<string>();
  const pool = [...blanks.map((b) => blankAnswer(table, b)), ...distractors].filter((text) => {
    const key = norm(text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return stablePermutation(pool.length, pool.join("|")).map((i) => pool[i]);
}

/** `chosen[i]` : texte choisi pour la case masquée i (null = vide). `wrong` : cases fausses ou vides. */
export function checkFillTable(
  table: CourseTable,
  blanks: readonly CycleCellRef[],
  chosen: readonly (string | null)[],
): ActionResult {
  return result(
    blanks.flatMap((b, i) => {
      const given = chosen[i];
      return given != null && norm(given) === norm(blankAnswer(table, b)) ? [] : [i];
    }),
  );
}

/** Indice de la case masquée située en (row, col), ou -1. */
export const blankIndex = (blanks: readonly CycleCellRef[], row: number, col: number): number =>
  blanks.findIndex((b) => b.row === row && b.col === col);

// ─── États « solution » (reprise d'une action déjà résolue, « Voir la solution ») ───

export const orderSolution = (items: readonly string[]): number[] => items.map((_, i) => i);
export const classifySolution = (cases: readonly ClassifyCase[]): number[] => cases.map((c) => c.category_index);
export const matchSolution = (setup: MatchSetup): number[] => [...setup.correct];
export const fillSolution = (table: CourseTable, blanks: readonly CycleCellRef[]): string[] =>
  blanks.map((b) => blankAnswer(table, b));

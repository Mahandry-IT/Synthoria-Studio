import type { DueCard, ReviewCardMode, ReviewResult } from "./review.schema";

export interface ReviewSummary {
  total: number;
  correct: number;
  incorrect: number;
  /** Pourcentage entier de cartes sues (0 si aucune carte révisée). */
  percent: number;
}

/** Bilan d'une session de révision à partir des résultats saisis. */
export function summarizeReview(results: ReviewResult[]): ReviewSummary {
  const correct = results.filter((r) => r === "correct").length;
  return {
    total: results.length,
    correct,
    incorrect: results.length - correct,
    percent: results.length === 0 ? 0 : Math.round((correct / results.length) * 100),
  };
}

/** Le verso peut contenir « bonne réponse\nexplication » : sépare les deux pour un affichage lisible. */
export function splitBack(back: string): { answer: string; explanation: string } {
  const [answer, ...rest] = back.split("\n");
  return { answer: answer ?? "", explanation: rest.join("\n").trim() };
}

/** Libellé lisible d'une boîte de Leitner (0 = J+1 … 3 = J+21). */
export function boxLabel(box: number): string {
  const labels = ["Nouvelle / à revoir", "Boîte 2", "Boîte 3", "Boîte 4 (maîtrisée)"];
  return labels[Math.min(Math.max(box, 0), labels.length - 1)];
}

/** Un QCM n'a de sens qu'avec au moins deux choix et une bonne réponse valide. */
function hasUsableChoices(card: Pick<DueCard, "choices" | "correct_indices">): boolean {
  return (
    card.choices.length >= 2 &&
    card.correct_indices.length > 0 &&
    card.correct_indices.every((i) => i < card.choices.length)
  );
}

/**
 * Mode d'une carte : celui du serveur s'il est fourni, sinon la même règle déterministe
 * (QCM si `box + variant_no` est pair, réponse libre sinon). Sans choix exploitables : réponse libre.
 */
export function resolveCardMode(card: Pick<DueCard, "mode" | "box" | "variant_no" | "choices" | "correct_indices">): ReviewCardMode {
  if (!hasUsableChoices(card)) return "text";
  if (card.mode) return card.mode;
  return (card.box + card.variant_no) % 2 === 0 ? "qcm" : "text";
}

/** Correction d'un QCM : juste si les choix cochés sont exactement les bonnes réponses. */
export function isChoiceCorrect(correctIndices: number[], selected: number[]): boolean {
  const expected = [...new Set(correctIndices)].sort((a, b) => a - b);
  const given = [...new Set(selected)].sort((a, b) => a - b);
  return expected.length > 0 && expected.length === given.length && expected.every((v, i) => v === given[i]);
}

/** Corrigé d'une carte : explication dédiée si le serveur la fournit, sinon celle incluse dans le verso. */
export function cardCorrection(card: Pick<DueCard, "back" | "explanation">): { answer: string; explanation: string } {
  const { answer, explanation } = splitBack(card.back);
  return { answer, explanation: card.explanation.trim() || explanation };
}

/** Délais de révision des quatre boîtes de Leitner (boîte 0 → J+1 … boîte 3 → J+21). */
export const BOX_DELAYS = ["J+1", "J+3", "J+7", "J+21"] as const;

/** Délai d'une boîte (« J+1 » … « J+21 ») ; valeur bornée aux quatre boîtes. */
export function boxToDelay(box: number): (typeof BOX_DELAYS)[number] {
  const index = Number.isFinite(box) ? Math.min(Math.max(Math.trunc(box), 0), BOX_DELAYS.length - 1) : 0;
  return BOX_DELAYS[index];
}

/** Effectifs par boîte des cartes de la série en cours (quatre cases, boîtes ≥ 3 regroupées). */
export function countByBox(cards: Pick<DueCard, "box">[]): number[] {
  const counts = BOX_DELAYS.map(() => 0);
  for (const card of cards) {
    const index = Number.isFinite(card.box) ? Math.min(Math.max(Math.trunc(card.box), 0), counts.length - 1) : 0;
    counts[index] += 1;
  }
  return counts;
}

/** « Carte 3 sur 20 » à partir de l'index (0 = première carte) et du total de la série. */
export function cardPositionLabel(index: number, total: number): string {
  const position = Math.min(Math.max(index + 1, 1), Math.max(total, 1));
  return `Carte ${position} sur ${Math.max(total, 1)}`;
}

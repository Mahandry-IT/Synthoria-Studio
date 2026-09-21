import type { ReviewResult } from "./review.schema";

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

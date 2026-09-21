import { describe, expect, it } from "vitest";
import { boxLabel, splitBack, summarizeReview } from "./review.logic";
import { dueCardListSchema, reviewResponseSchema } from "./review.schema";

describe("review.logic", () => {
  it("summarizeReview compte et arrondit", () => {
    expect(summarizeReview(["correct", "incorrect", "correct"])).toEqual({
      total: 3,
      correct: 2,
      incorrect: 1,
      percent: 67,
    });
    expect(summarizeReview([])).toEqual({ total: 0, correct: 0, incorrect: 0, percent: 0 });
  });

  it("splitBack sépare la réponse de l'explication", () => {
    expect(splitBack("B\nParce que.\nEt aussi.")).toEqual({ answer: "B", explanation: "Parce que.\nEt aussi." });
    expect(splitBack("B")).toEqual({ answer: "B", explanation: "" });
  });

  it("boxLabel borne l'indice", () => {
    expect(boxLabel(-1)).toBe("Nouvelle / à revoir");
    expect(boxLabel(99)).toBe("Boîte 4 (maîtrisée)");
  });
});

describe("review.schema", () => {
  const card = {
    session_id: "3f6f1c1e-9d0a-4c6e-8a55-0b7d4d5e6f70",
    card_id: "1-0",
    front: "Q ?",
    back: "B",
  };

  it("accepte une carte jamais révisée (due_at nul, boîte par défaut)", () => {
    const parsed = dueCardListSchema.parse({ cards: [{ ...card, due_at: null }], total_due: 1 });
    expect(parsed.cards[0].box).toBe(0);
    expect(parsed.cards[0].course_title).toBe("");
  });

  it("refuse un identifiant de session invalide", () => {
    expect(dueCardListSchema.safeParse({ cards: [{ ...card, session_id: "nope" }], total_due: 1 }).success).toBe(false);
  });

  it("valide la réponse d'une révision", () => {
    expect(reviewResponseSchema.parse({ box: 1, due_at: "2026-09-25T00:00:00Z" }).box).toBe(1);
    expect(reviewResponseSchema.safeParse({ box: -1, due_at: "x" }).success).toBe(false);
  });
});

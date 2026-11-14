import { describe, expect, it } from "vitest";
import { boxLabel, boxToDelay, cardCorrection, cardPositionLabel, countByBox, isChoiceCorrect, resolveCardMode, splitBack, summarizeReview } from "./review.logic";
import { dueCardListSchema, dueCardSchema, reviewResponseSchema } from "./review.schema";

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

describe("review — cartes mixtes", () => {
  const base = {
    box: 0,
    variant_no: 0,
    mode: undefined,
    choices: ["A", "B", "C"],
    correct_indices: [1],
  };

  it("alterne QCM et réponse libre selon box + variant_no", () => {
    expect(resolveCardMode(base)).toBe("qcm");
    expect(resolveCardMode({ ...base, variant_no: 1 })).toBe("text");
    expect(resolveCardMode({ ...base, box: 1, variant_no: 1 })).toBe("qcm");
  });

  it("suit le mode du serveur s'il est fourni", () => {
    expect(resolveCardMode({ ...base, mode: "text" })).toBe("text");
  });

  it("carte sans choix exploitables : toujours en réponse libre", () => {
    expect(resolveCardMode({ ...base, choices: [], mode: "qcm" })).toBe("text");
    expect(resolveCardMode({ ...base, correct_indices: [] })).toBe("text");
    expect(resolveCardMode({ ...base, correct_indices: [5] })).toBe("text");
  });

  it("corrige un QCM par égalité exacte des ensembles", () => {
    expect(isChoiceCorrect([1], [1])).toBe(true);
    expect(isChoiceCorrect([0, 2], [2, 0, 2])).toBe(true);
    expect(isChoiceCorrect([0, 2], [0])).toBe(false);
    expect(isChoiceCorrect([1], [])).toBe(false);
    expect(isChoiceCorrect([], [])).toBe(false);
  });

  it("corrigé : explication du serveur, sinon celle du verso", () => {
    expect(cardCorrection({ back: "B\nDu verso", explanation: "" })).toEqual({ answer: "B", explanation: "Du verso" });
    expect(cardCorrection({ back: "B\nDu verso", explanation: "Dédiée" })).toEqual({ answer: "B", explanation: "Dédiée" });
  });

  it("schéma : champs de variante facultatifs (backend antérieur)", () => {
    const parsed = dueCardSchema.parse({
      session_id: "3f6f1c1e-9d0a-4c6e-8a55-0b7d4d5e6f70",
      card_id: "1-0",
      front: "Q ?",
      back: "B",
      choices: null,
    });
    expect(parsed).toMatchObject({ variant_no: 0, choices: [], correct_indices: [], explanation: "" });
    expect(parsed.mode).toBeUndefined();
  });

  it("boxToDelay donne J+1, J+3, J+7, J+21 et borne les valeurs", () => {
    expect([0, 1, 2, 3].map(boxToDelay)).toEqual(["J+1", "J+3", "J+7", "J+21"]);
    expect(boxToDelay(-2)).toBe("J+1");
    expect(boxToDelay(9)).toBe("J+21");
    expect(boxToDelay(Number.NaN)).toBe("J+1");
  });

  it("countByBox compte les quatre boîtes et regroupe les boîtes ≥ 3", () => {
    expect(countByBox([{ box: 0 }, { box: 0 }, { box: 2 }, { box: 3 }, { box: 5 }])).toEqual([2, 0, 1, 2]);
    expect(countByBox([])).toEqual([0, 0, 0, 0]);
  });

  it("cardPositionLabel formule la position dans la série", () => {
    expect(cardPositionLabel(0, 20)).toBe("Carte 1 sur 20");
    expect(cardPositionLabel(19, 20)).toBe("Carte 20 sur 20");
    expect(cardPositionLabel(0, 0)).toBe("Carte 1 sur 1");
  });
});

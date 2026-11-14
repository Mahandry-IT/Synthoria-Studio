import { describe, expect, it } from "vitest";
import type { CourseTable, StepPrediction, TrapEntry } from "./course.types";
import {
  classifySolution,
  fillSolution,
  matchSolution,
  orderSolution,
  checkClassify,
  checkFillTable,
  checkMatch,
  checkOrder,
  buildMatch,
  fillChoices,
  initialOrder,
  moveItem,
  stablePermutation,
} from "./cycleActions";
import {
  checkPrediction,
  isChallengeCorrect,
  isExactSelection,
  isRewriteCorrect,
  isSpotCorrect,
  parseValueInput,
  pickedOf,
  valueTextOf,
  predictionToRecord,
  recordToPrediction,
} from "./cycleAnswers";
import { cycleDurationLabel } from "./cycleDuration";
import {
  answerKey,
  getAnswer,
  recordAnswer,
  revealedMiniSteps,
  revealNextMiniStep,
  sanitizeCycleProgress,
  updateFromLatest,
  type CycleProgress,
} from "./cycleProgress";
import { parseNumericInput } from "./quizGrading";

const cycleWith = (min?: number, max?: number) => ({
  cycle: { thread: "", steps: [], vocabulary: [], challenge: {} as never, minutes_min: min, minutes_max: max },
});

describe("durée estimée", () => {
  it("égale : « ~5 min » ; sinon plage « 4–6 min »", () => {
    expect(cycleDurationLabel(cycleWith(5, 5))).toBe("~5 min");
    expect(cycleDurationLabel(cycleWith(4, 6))).toBe("4–6 min");
  });
  it("sans cycle ou sans durée : rien", () => {
    expect(cycleDurationLabel({})).toBeNull();
    expect(cycleDurationLabel(cycleWith())).toBeNull();
    expect(cycleDurationLabel(cycleWith(4, undefined))).toBeNull();
  });
});

describe("défi à cases à cocher", () => {
  const challenge = { correct_indices: [0, 2] };
  it("ensemble exact des indices, ordre ignoré", () => {
    expect(isChallengeCorrect(challenge, [2, 0])).toBe(true);
    expect(isChallengeCorrect(challenge, [0])).toBe(false);
    expect(isChallengeCorrect(challenge, [0, 1, 2])).toBe(false);
    expect(isChallengeCorrect(challenge, [])).toBe(false);
  });
  it("doublons ignorés, attendu vide jamais juste", () => {
    expect(isExactSelection([1], [1, 1])).toBe(true);
    expect(isExactSelection([], [])).toBe(false);
  });
});

describe("prédiction", () => {
  const value: StepPrediction = {
    kind: "value", question: "?", options: [], correct_index: null, expected_value: 4, tolerance: 0.5, unit: "A", outcome: "4 A",
  };
  const choice: StepPrediction = { ...value, kind: "choice", options: ["a", "b"], correct_index: 1, expected_value: null };

  it("valeur : dans la tolérance (bornes incluses), hors tolérance", () => {
    expect(checkPrediction(value, { kind: "value", value: 4.5 })).toBe("correct");
    expect(checkPrediction(value, { kind: "value", value: 3.5 })).toBe("correct");
    expect(checkPrediction(value, { kind: "value", value: 4.6 })).toBe("incorrect");
  });
  it("tolérance nulle : écart minimal du quiz", () => {
    const exact = { ...value, tolerance: 0 };
    expect(checkPrediction(exact, { kind: "value", value: 4 })).toBe("correct");
    expect(checkPrediction(exact, { kind: "value", value: 4.01 })).toBe("incorrect");
  });
  it("choix : bon et mauvais indice", () => {
    expect(checkPrediction(choice, { kind: "choice", index: 1 })).toBe("correct");
    expect(checkPrediction(choice, { kind: "choice", index: 0 })).toBe("incorrect");
  });
  it("« je ne sais pas » et saisie vide : retour « passée », la progression continue", () => {
    expect(checkPrediction(value, { kind: "skip" })).toBe("skipped");
    expect(checkPrediction(value, { kind: "value", value: null })).toBe("skipped");
  });
  it("saisie : virgule française, espaces, texte illisible", () => {
    expect(parseValueInput(" 1 234,5 ")).toBe(1234.5);
    expect(parseValueInput("abc")).toBeNull();
    expect(parseValueInput("")).toBeNull();
  });
  it("aller-retour avec la valeur mémorisée", () => {
    expect(recordToPrediction(predictionToRecord({ kind: "choice", index: 2 }))).toEqual({ kind: "choice", index: 2 });
    expect(recordToPrediction(predictionToRecord({ kind: "value", value: 0 }))).toEqual({ kind: "value", value: 0 });
    expect(recordToPrediction(predictionToRecord({ kind: "skip" }))).toEqual({ kind: "skip" });
    expect(recordToPrediction({})).toEqual({ kind: "skip" });
  });
});

describe("pièges", () => {
  const entry = { wrong_index: 1, correct_rewrite_index: 0 } as TrapEntry;
  it("spot et spot_rewrite", () => {
    expect(isSpotCorrect(entry, 1)).toBe(true);
    expect(isSpotCorrect(entry, 0)).toBe(false);
    expect(isRewriteCorrect(entry, 0)).toBe(true);
    expect(isRewriteCorrect(entry, 1)).toBe(false);
    expect(isSpotCorrect({ wrong_index: null }, 0)).toBe(false);
  });
});

describe("actions de reconstruction", () => {
  it("mélange stable, jamais l'identité, déterministe", () => {
    for (const seed of ["a", "b", "c", "d", "e", "f"]) {
      const p = stablePermutation(4, seed);
      expect([...p].sort()).toEqual([0, 1, 2, 3]);
      expect(p.every((v, i) => v === i)).toBe(false);
      expect(stablePermutation(4, seed)).toEqual(p);
    }
    expect(stablePermutation(1, "x")).toEqual([0]);
    expect(stablePermutation(0, "x")).toEqual([]);
  });

  it("ordre : déplacements bornés puis vérification", () => {
    expect(moveItem([0, 1, 2], 1, -1)).toEqual([1, 0, 2]);
    expect(moveItem([0, 1, 2], 0, -1)).toEqual([0, 1, 2]);
    expect(moveItem([0, 1, 2], 2, 1)).toEqual([0, 1, 2]);
    expect(checkOrder([0, 1, 2]).correct).toBe(true);
    expect(checkOrder([1, 0, 2])).toEqual({ correct: false, wrong: [0, 1] });
    const start = initialOrder(["a", "b", "c"]);
    expect(checkOrder(start).correct).toBe(false);
  });

  it("classement : cas faux ou non classés signalés", () => {
    const cases = [{ label: "x", category_index: 0 }, { label: "y", category_index: 1 }];
    expect(checkClassify(cases, [0, 1]).correct).toBe(true);
    expect(checkClassify(cases, [0, 0])).toEqual({ correct: false, wrong: [1] });
    expect(checkClassify(cases, [null, 1]).wrong).toEqual([0]);
  });

  it("association : bonnes options retrouvées malgré le mélange", () => {
    const pairs = [{ left: "a", right: "1" }, { left: "b", right: "2" }, { left: "c", right: "3" }];
    const { options, correct } = buildMatch(pairs);
    expect(correct.map((c) => options[c])).toEqual(["1", "2", "3"]);
    expect(checkMatch(correct, correct).correct).toBe(true);
    expect(checkMatch(correct, [null, correct[1], correct[2]]).wrong).toEqual([0]);
  });

  it("tableau à compléter : leurres mêlés, casse et espaces ignorés", () => {
    const table: CourseTable = { headers: ["A", "B"], rows: [["x", "Oui"], ["y", "Non"]] };
    const blanks = [{ row: 0, col: 1 }, { row: 1, col: 1 }];
    const choices = fillChoices(table, blanks, ["Peut-être", "oui"]);
    expect([...choices].sort()).toEqual(["Non", "Oui", "Peut-être"]); // « oui » = doublon de « Oui »
    expect(checkFillTable(table, blanks, [" oui ", "Non"]).correct).toBe(true);
    expect(checkFillTable(table, blanks, ["Non", null])).toEqual({ correct: false, wrong: [0, 1] });
  });
});

describe("progression du cycle", () => {
  it("mini-étapes : au moins une, bornées, tout dévoilé si demandé", () => {
    expect(revealedMiniSteps({}, "s", 3)).toBe(1);
    let p = revealNextMiniStep({}, "s", 3);
    p = revealNextMiniStep(revealNextMiniStep(p, "s", 3), "s", 3);
    expect(revealedMiniSteps(p, "s", 3)).toBe(3);
    expect(revealedMiniSteps({}, "s", 3, true)).toBe(3);
    expect(revealedMiniSteps({}, "s", 0)).toBe(0);
  });

  it("réponses mémorisées par interaction, sans toucher aux autres", () => {
    const p = recordAnswer(recordAnswer({}, "s", answerKey.challenge, { picked: [1] }), "s", answerKey.prediction(0), { skipped: true });
    expect(getAnswer(p, "s", answerKey.challenge)).toEqual({ picked: [1] });
    expect(getAnswer(p, "s", answerKey.prediction(0))).toEqual({ skipped: true });
    expect(getAnswer(p, "autre", answerKey.challenge)).toBeUndefined();
  });

  it("reprise : lecture tolérante d'un stockage corrompu", () => {
    expect(sanitizeCycleProgress(null)).toEqual({});
    expect(sanitizeCycleProgress("x")).toEqual({});
    expect(sanitizeCycleProgress([1])).toEqual({});
    const clean = sanitizeCycleProgress({
      s: { steps: 2, answers: { a: { picked: [0], junk: 1 }, b: "no", c: { value: "NaN", correct: true } } },
      t: { steps: -3, answers: 5 },
      u: 7,
    });
    expect(clean.s).toEqual({ steps: 2, answers: { a: { picked: [0] }, c: { correct: true } } });
    expect(clean.t).toEqual({});
    expect(clean.u).toBeUndefined();
  });
});

describe("reprise après rafraîchissement (la réponse prime sur le brouillon)", () => {
  it("choix et saisie : réponse mémorisée si elle existe, brouillon sinon", () => {
    expect(pickedOf(undefined, [2])).toEqual([2]);
    expect(pickedOf({ picked: [0, 1] }, [2])).toEqual([0, 1]);
    expect(pickedOf({ skipped: true }, [2])).toEqual([2]);
    expect(valueTextOf(undefined, "12")).toBe("12");
    expect(valueTextOf({ value: 3.5 }, "")).toBe("3.5");
    expect(valueTextOf({ value: null }, "x")).toBe("x");
  });

  it("états solution : chacun est jugé correct par la vérification de son action", () => {
    expect(checkOrder(orderSolution(["a", "b", "c"])).correct).toBe(true);
    const cases = [{ label: "x", category_index: 1 }, { label: "y", category_index: 0 }];
    expect(checkClassify(cases, classifySolution(cases)).correct).toBe(true);
    const setup = buildMatch([{ left: "a", right: "1" }, { left: "b", right: "2" }]);
    expect(checkMatch(setup.correct, matchSolution(setup)).correct).toBe(true);
    const table: CourseTable = { headers: ["A", "B"], rows: [["x", "Oui"], ["y", "Non"]] };
    const blanks = [{ row: 0, col: 1 }, { row: 1, col: 1 }];
    expect(checkFillTable(table, blanks, fillSolution(table, blanks)).correct).toBe(true);
  });
});

describe("saisie numérique partagée avec le quiz", () => {
  it("même lecture que le quiz ; vide ou illisible = null (validation impossible)", () => {
    expect(parseValueInput).toBe(parseNumericInput);
    for (const raw of ["", "  ", "abc", "1,2,3", "NaN"]) expect(parseValueInput(raw)).toBeNull();
    expect(parseValueInput("-2,5")).toBe(-2.5);
  });
});

describe("mise à jour depuis la dernière valeur écrite", () => {
  it("deux mises à jour avant le re-rendu se composent au lieu de s'écraser", () => {
    const latest: { current: CycleProgress } = { current: {} };
    const written: CycleProgress[] = [];
    const write = (p: CycleProgress) => written.push(p);
    updateFromLatest(latest, (p) => recordAnswer(p, "s", "a", { skipped: true }), write);
    updateFromLatest(latest, (p) => recordAnswer(p, "s", "b", { picked: [1] }), write);
    expect(written[1].s?.answers).toEqual({ a: { skipped: true }, b: { picked: [1] } });
    expect(latest.current).toBe(written[1]);
  });
});

import { describe, expect, it } from "vitest";
import {
  INITIAL_PAGER_STATE,
  clampStep,
  followLatestState,
  goToState,
  isStepMounted,
  pagerCounter,
  pagerLabel,
  stepForKey,
  swipeDirection,
} from "./stepPager";

describe("clampStep", () => {
  it("borne dans [0, revealed - 1]", () => {
    expect(clampStep(-3, 4)).toBe(0);
    expect(clampStep(2, 4)).toBe(2);
    expect(clampStep(9, 4)).toBe(3);
  });
  it("0 quand rien n'est dévoilé, et tolère NaN", () => {
    expect(clampStep(2, 0)).toBe(0);
    expect(clampStep(Number.NaN, 3)).toBe(2);
  });
});

describe("stepForKey", () => {
  it("flèches : une étape, sans boucle aux bornes", () => {
    expect(stepForKey(1, "ArrowRight", 3)).toBe(2);
    expect(stepForKey(2, "ArrowRight", 3)).toBe(2);
    expect(stepForKey(1, "ArrowLeft", 3)).toBe(0);
    expect(stepForKey(0, "ArrowLeft", 3)).toBe(0);
  });
  it("Début et Fin", () => {
    expect(stepForKey(2, "Home", 4)).toBe(0);
    expect(stepForKey(0, "End", 4)).toBe(3);
  });
  it("autre touche : null", () => {
    expect(stepForKey(1, "Enter", 3)).toBeNull();
    expect(stepForKey(1, "ArrowUp", 3)).toBeNull();
  });
});

describe("swipeDirection", () => {
  it("gauche = suivante (1), droite = précédente (-1)", () => {
    expect(swipeDirection(-80, 5)).toBe(1);
    expect(swipeDirection(80, -5)).toBe(-1);
  });
  it("sous le seuil : null ; seuil configurable", () => {
    expect(swipeDirection(-47, 0)).toBeNull();
    expect(swipeDirection(-48, 0)).toBe(1);
    expect(swipeDirection(-20, 0, 10)).toBe(1);
  });
  it("geste surtout vertical : null", () => {
    expect(swipeDirection(-90, 120)).toBeNull();
    expect(swipeDirection(60, 61)).toBeNull();
  });
});

describe("libellés", () => {
  it("compteur et annonce, 1-based", () => {
    expect(pagerCounter(1, 5)).toBe("2 / 5");
    expect(pagerLabel(1, 5, "Pourquoi")).toBe("Étape 2 sur 5 : Pourquoi");
  });
  it("titre vide omis", () => {
    expect(pagerLabel(0, 3, "  ")).toBe("Étape 1 sur 3");
    expect(pagerLabel(0, 3)).toBe("Étape 1 sur 3");
  });
});

describe("état du pager", () => {
  it("à la reprise, seule l'étape affichée est montée", () => {
    expect(isStepMounted(INITIAL_PAGER_STATE, 3, 3)).toBe(true);
    expect(isStepMounted(INITIAL_PAGER_STATE, 0, 3)).toBe(false);
  });
  it("revenir en arrière monte l'étape visée et garde la précédente", () => {
    const state = goToState(INITIAL_PAGER_STATE, 0, 3);
    expect(state.pick).toBe(0);
    expect(state.direction).toBe("prev");
    expect(isStepMounted(state, 0, 0)).toBe(true);
    expect(isStepMounted(state, 3, 0)).toBe(true);
    expect(isStepMounted(state, 1, 0)).toBe(false);
  });
  it("débloquer une étape la suit (pick nul) et garde l'étape quittée montée", () => {
    const state = followLatestState(goToState(INITIAL_PAGER_STATE, 0, 2), 0);
    expect(state.pick).toBeNull();
    expect(state.direction).toBe("next");
    expect(isStepMounted(state, 0, 3)).toBe(true);
  });
});

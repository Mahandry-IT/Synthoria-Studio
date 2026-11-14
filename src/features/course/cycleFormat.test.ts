import { describe, expect, it } from "vitest";
import { stageProgressLabel, stageView } from "./cycleFormat";

describe("stageProgressLabel", () => {
  it("annonce le temps courant avec son titre fixe", () => {
    expect(stageProgressLabel(1, 5, "challenge")).toBe("Temps 1 sur 5 · Défi");
    expect(stageProgressLabel(3, 3, "trial")).toBe("Temps 3 sur 3 · Épreuve");
  });
  it("borne n dans [1, N] (3, 4 ou 5 temps selon la section)", () => {
    expect(stageProgressLabel(0, 4, "challenge")).toBe("Temps 1 sur 4 · Défi");
    expect(stageProgressLabel(9, 4, "traps")).toBe("Temps 4 sur 4 · Les pièges classiques");
  });
});

describe("stageView", () => {
  it("seul le dernier temps dévoilé est courant", () => {
    expect([0, 1, 2].map((p) => stageView(p, 3, false))).toEqual(["done", "done", "current"]);
    expect(stageView(0, 1, false)).toBe("current");
  });
  it("section terminée : tous les temps sont faits", () => {
    expect([0, 1, 2].map((p) => stageView(p, 3, true))).toEqual(["done", "done", "done"]);
  });
});

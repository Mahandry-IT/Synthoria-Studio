import { describe, expect, it } from "vitest";
import { fieldAria, progressNow, progressPercent, stepState } from "./uiState";

describe("progressNow / progressPercent", () => {
  it("borne la valeur dans [0, max]", () => {
    expect(progressNow(-5)).toBe(0);
    expect(progressNow(150)).toBe(100);
    expect(progressNow(30, 60)).toBe(30);
    expect(progressNow(90, 60)).toBe(60);
  });
  it("renvoie undefined (indéterminé) si la valeur est absente ou invalide", () => {
    expect(progressNow(undefined)).toBeUndefined();
    expect(progressNow(null)).toBeUndefined();
    expect(progressNow(Number.NaN)).toBeUndefined();
    expect(progressPercent(undefined)).toBeUndefined();
  });
  it("calcule le pourcentage et ignore un max invalide", () => {
    expect(progressPercent(30, 60)).toBe(50);
    expect(progressPercent(50, 0)).toBe(50);
    expect(progressPercent(50, Number.NaN)).toBe(50);
  });
});

describe("stepState", () => {
  it("distingue fait, courant et à venir", () => {
    expect([1, 2, 3].map((s) => stepState(s, 2, 3))).toEqual(["done", "current", "todo"]);
  });
  it("borne l'étape courante", () => {
    expect(stepState(1, 0, 3)).toBe("current");
    expect(stepState(3, 99, 3)).toBe("current");
    expect(stepState(1, Number.NaN, 3)).toBe("current");
  });
});

describe("fieldAria", () => {
  it("référence l'aide et l'erreur présentes", () => {
    expect(fieldAria({ id: "f", help: "a", error: "b" })).toMatchObject({
      describedBy: "f-help f-error",
      invalid: true,
    });
    expect(fieldAria({ id: "f", help: "a" })).toMatchObject({ describedBy: "f-help", invalid: undefined });
  });
  it("n'expose rien sans aide ni erreur", () => {
    expect(fieldAria({ id: "f" }).describedBy).toBeUndefined();
  });
});

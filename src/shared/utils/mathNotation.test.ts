import { describe, expect, it } from "vitest";
import { splitBareSubscripts, toAccentedMath } from "./mathNotation";

describe("toAccentedMath", () => {
  it.each([
    ["x_bar", String.raw`\bar{x}`],
    ["y_hat", String.raw`\hat{y}`],
    ["X_bar", String.raw`\bar{X}`],
    ["mu_hat", String.raw`\hat{\mu}`],
    ["sigma_tilde", String.raw`\tilde{\sigma}`],
    ["  x_bar ", String.raw`\bar{x}`],
  ])("convertit %s", (code, expected) => {
    expect(toAccentedMath(code)).toBe(expected);
  });

  it.each(["my_bar", "x_bar_2", "foo_hat", "x_barre", "bar", "x_"])(
    "laisse %s tel quel (vrai identifiant de code)",
    (code) => {
      expect(toAccentedMath(code)).toBeNull();
    },
  );
});

describe("splitBareSubscripts", () => {
  it("convertit les indices nus en formules et garde le texte autour", () => {
    expect(splitBareSubscripts("Q_3 - Q_1 = 500")).toEqual([
      { math: "Q_3" },
      { text: " - " },
      { math: "Q_1" },
      { text: " = 500" },
    ]);
  });

  it("gère la phrase de l'énoncé, la ponctuation et les indices entre accolades", () => {
    expect(splitBareSubscripts("La médiane Q_2 se situe, puis x_{12}.")).toEqual([
      { text: "La médiane " },
      { math: "Q_2" },
      { text: " se situe, puis " },
      { math: "x_{12}" },
      { text: "." },
    ]);
    expect(splitBareSubscripts("x_i")).toEqual([{ math: "x_i" }]);
  });

  it.each(["file_name", "x_max", "snake_case_var", "my_1", "Q_123", "texte sans indice", String.raw`\alpha_1`])(
    "laisse %s intact",
    (text) => {
      expect(splitBareSubscripts(text)).toEqual([{ text }]);
    },
  );

  it("renvoie une liste vide pour un texte vide", () => {
    expect(splitBareSubscripts("")).toEqual([]);
  });
});

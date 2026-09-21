import { describe, expect, it } from "vitest";
import { repairLatexEscapes, splitBareMath, toAccentedMath } from "./mathNotation";

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

describe("repairLatexEscapes", () => {
  it("rétablit \\frac lu comme un saut de page JSON (« rac{…} » à l'écran)", () => {
    expect(repairLatexEscapes("F(x) = \u000Crac{x - 3}{x + 2}")).toBe(String.raw`F(x) = \frac{x - 3}{x + 2}`);
  });

  it.each([
    ["\times", String.raw`\times`],
    ["\text{cm}", String.raw`\text{cm}`],
    ["\theta", String.raw`\theta`],
    ["\u0008eta", String.raw`\beta`],
    ["\u0008ar{x}", String.raw`\bar{x}`],
    ["\rho", String.raw`\rho`],
    ["\rightarrow", String.raw`\rightarrow`],
    ["\u000Bec{v}", String.raw`\vec{v}`],
    ["\neq", String.raw`\neq`],
  ])("rétablit %j", (broken, fixed) => {
    expect(repairLatexEscapes(broken)).toBe(fixed);
  });

  it("répare plusieurs commandes dans un même texte", () => {
    expect(repairLatexEscapes("\u000Crac{1}{2} \times \u000Crac{3}{4}")).toBe(
      String.raw`\frac{1}{2} \times \frac{3}{4}`,
    );
  });

  it("ne touche pas au texte normal ni aux commandes déjà correctes", () => {
    const untouched = [
      String.raw`\frac{1}{2}`,
      "Une tabulation\tsuivie d'un mot",
      "ligne 1\nligne 2",
      "fin de ligne\r\nsuivante",
      "\tto be or not",
      "",
    ];
    for (const text of untouched) expect(repairLatexEscapes(text)).toBe(text);
  });

  it("est idempotent", () => {
    const once = repairLatexEscapes("\u000Crac{1}{2}");
    expect(repairLatexEscapes(once)).toBe(once);
  });
});

describe("splitBareMath", () => {
  it("convertit les indices nus en formules et garde le texte autour", () => {
    expect(splitBareMath("Q_3 - Q_1 = 500")).toEqual([
      { math: "Q_3" },
      { text: " - " },
      { math: "Q_1" },
      { text: " = 500" },
    ]);
  });

  it("gère la phrase de l'énoncé, la ponctuation et les indices entre accolades", () => {
    expect(splitBareMath("La médiane Q_2 se situe, puis x_{12}.")).toEqual([
      { text: "La médiane " },
      { math: "Q_2" },
      { text: " se situe, puis " },
      { math: "x_{12}" },
      { text: "." },
    ]);
    expect(splitBareMath("x_i")).toEqual([{ math: "x_i" }]);
  });

  it("rend une fraction écrite sans `$`", () => {
    expect(splitBareMath(String.raw`F(x) = \frac{x - 3}{x + 2},`)).toEqual([
      { text: "F(x) = " },
      { math: String.raw`\frac{x - 3}{x + 2}` },
      { text: "," },
    ]);
  });

  it("gère les exposants et les accolades imbriquées d'une fraction", () => {
    const fraction = String.raw`\frac{x^{2} - 9}{x^2 + 5x + 6}`;

    expect(splitBareMath(`F(x) = ${fraction}`)).toEqual([{ text: "F(x) = " }, { math: fraction }]);
  });

  it.each([
    String.raw`\sqrt{x + 1}`,
    String.raw`\sqrt[3]{27}`,
    String.raw`\dfrac{a}{b}`,
    String.raw`\bar{x}`,
    String.raw`\binom{n}{k}`,
  ])("rend la commande %s", (command) => {
    expect(splitBareMath(`avec ${command} ici`)).toEqual([
      { text: "avec " },
      { math: command },
      { text: " ici" },
    ]);
  });

  it("combine fraction et indice dans le même texte", () => {
    expect(splitBareMath(String.raw`Q_1 vaut \frac{a}{b}`)).toEqual([
      { math: "Q_1" },
      { text: " vaut " },
      { math: String.raw`\frac{a}{b}` },
    ]);
  });

  it.each([
    "file_name",
    "x_max",
    "snake_case_var",
    "my_1",
    "Q_123",
    "texte sans indice",
    String.raw`\alpha_1`,
    String.raw`\frac{incomplet`,
    String.raw`\frac{1}`,
  ])("laisse %s intact", (text) => {
    expect(splitBareMath(text)).toEqual([{ text }]);
  });

  it("renvoie une liste vide pour un texte vide", () => {
    expect(splitBareMath("")).toEqual([]);
  });
});

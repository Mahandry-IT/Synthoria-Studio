import { describe, expect, it } from "vitest";
import { toAccentedMath } from "./mathNotation";

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

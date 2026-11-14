import { describe, expect, it } from "vitest";
import { parseDarkThemeFlag } from "./darkThemeFlag";

describe("parseDarkThemeFlag", () => {
  it("ne désactive le sombre que pour la valeur exacte « false »", () => {
    expect(parseDarkThemeFlag("false")).toBe(false);
  });

  it.each([undefined, "", "true", "0", "FALSE", "False", " false", "no"])("%j → vrai (défaut)", (raw) => {
    expect(parseDarkThemeFlag(raw)).toBe(true);
  });
});

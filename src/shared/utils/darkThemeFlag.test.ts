import { describe, expect, it } from "vitest";
import { parseDarkThemeFlag } from "./darkThemeFlag";

describe("parseDarkThemeFlag", () => {
  it("n'expose le sombre que pour la valeur exacte « true »", () => {
    expect(parseDarkThemeFlag("true")).toBe(true);
  });

  it.each([undefined, "", "false", "1", "TRUE", "True", " true", "yes"])("%j → faux (défaut)", (raw) => {
    expect(parseDarkThemeFlag(raw)).toBe(false);
  });
});

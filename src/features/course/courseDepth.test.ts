import { describe, expect, it } from "vitest";
import { COURSE_DEPTH_OPTIONS, shortDepthHelp } from "./courseDepth";

describe("shortDepthHelp", () => {
  it("garde la première phrase de l'aide", () => {
    expect(shortDepthHelp("L'essentiel en 5 sections. Limité à ce plafond.")).toBe("L'essentiel en 5 sections.");
  });

  it("renvoie l'aide entière quand elle tient en une phrase", () => {
    expect(shortDepthHelp("Toutes les notions détaillées.")).toBe("Toutes les notions détaillées.");
  });

  it("ne vide aucun niveau existant", () => {
    for (const option of COURSE_DEPTH_OPTIONS) expect(shortDepthHelp(option.help).length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import type { CourseSection, RegenerateIncompleteSectionsResponse } from "./course.types";
import { countIncompleteSections, describeRegeneration, isMissingWrapUp } from "./incompleteCourse";

const section = (overrides: Partial<CourseSection> = {}): CourseSection =>
  ({ id: "0", title: "T", ...overrides }) as CourseSection;

const result = (overrides: Partial<RegenerateIncompleteSectionsResponse> = {}): RegenerateIncompleteSectionsResponse => ({
  regenerated: [],
  failed: [],
  remaining_section_ids: [],
  stopped_reason: null,
  ...overrides,
});

describe("countIncompleteSections", () => {
  it("ne compte que les sections marquées incomplètes", () => {
    const sections = [section({ incomplete: true }), section({ incomplete: false }), section(), section({ incomplete: true })];

    expect(countIncompleteSections(sections)).toBe(2);
    expect(countIncompleteSections([])).toBe(0);
  });
});

describe("isMissingWrapUp", () => {
  it("est faux pour un cours avec résumé et quiz", () => {
    expect(isMissingWrapUp({ summary: "Résumé.", quiz: [{}] as never })).toBe(false);
  });

  it("est vrai sans résumé ou sans quiz", () => {
    expect(isMissingWrapUp({ summary: "  ", quiz: [{}] as never })).toBe(true);
    expect(isMissingWrapUp({ summary: "Résumé.", quiz: [] })).toBe(true);
    expect(isMissingWrapUp({ summary: "Résumé.", quiz: null })).toBe(true);
  });
});

describe("describeRegeneration", () => {
  it("annonce un succès complet", () => {
    expect(describeRegeneration(result({ regenerated: [section(), section()] }))).toEqual({
      kind: "success",
      message: "2 sections régénérées.",
    });
    expect(describeRegeneration(result({ regenerated: [section()] })).message).toBe("1 section régénérée.");
  });

  it("explique l'arrêt sur quota et compte ce qui reste", () => {
    const outcome = describeRegeneration(
      result({
        regenerated: [section()],
        failed: [{ section_id: "1", title: "B", reason: "quota" }],
        remaining_section_ids: ["2", "3"],
        stopped_reason: "quota",
      }),
    );

    expect(outcome.kind).toBe("warning");
    expect(outcome.message).toBe(
      "1 section régénérée. 3 sections restent incomplètes : quota du moteur IA atteint, réessayez plus tard.",
    );
  });

  it("invite à relancer quand le plafond par appel est atteint", () => {
    const outcome = describeRegeneration(
      result({ regenerated: [section()], remaining_section_ids: ["9"], stopped_reason: "limit" }),
    );

    expect(outcome.message).toBe("1 section régénérée. 1 section reste incomplète : relancez pour continuer.");
  });

  it("signale les sections dont la régénération a échoué sans arrêt du traitement", () => {
    const outcome = describeRegeneration(
      result({ failed: [{ section_id: "1", title: "B", reason: "invalid_response" }] }),
    );

    expect(outcome).toEqual({
      kind: "warning",
      message: "Aucune section n'a pu être régénérée. 1 section reste incomplète : relancez-les.",
    });
  });
});

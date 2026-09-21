import { describe, expect, it } from "vitest";
import { formatSectionRefs } from "./quizSections";

describe("formatSectionRefs", () => {
  it("trie, déduplique et accorde le libellé", () => {
    expect(formatSectionRefs([5, 2, 5])).toBe("Sections concernées : 2, 5");
    expect(formatSectionRefs([3])).toBe("Section concernée : 3");
  });

  it("renvoie null sans référence valide (anciens quiz)", () => {
    expect(formatSectionRefs(undefined)).toBeNull();
    expect(formatSectionRefs([])).toBeNull();
    expect(formatSectionRefs([0, -1, 1.5])).toBeNull();
  });
});

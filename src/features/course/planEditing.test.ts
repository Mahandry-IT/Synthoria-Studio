import { describe, expect, it } from "vitest";
import { COURSE_PLAN_MAX_SECTIONS } from "@/shared/utils/constants";
import {
  createBlankSection,
  insertSection,
  moveSection,
  removeSection,
  toEditable,
  toPlannedSections,
  updateSection,
  validatePlan,
} from "./planEditing";
import type { PlannedSection } from "./course.types";

const plan: PlannedSection[] = [
  { type: "development", title: "Principe", objective: "Comprendre", subtopics: ["flux", "rapport"], order: 2 },
  { type: "introduction", title: "Introduction", objective: "", subtopics: [], order: 1 },
  { type: "summary", title: "Résumé", objective: "Retenir", subtopics: ["a"], order: 3 },
];

const titles = (sections: { title: string }[]) => sections.map((s) => s.title);

describe("toEditable", () => {
  it("trie par order et assigne des clés uniques", () => {
    const sections = toEditable(plan);

    expect(titles(sections)).toEqual(["Introduction", "Principe", "Résumé"]);
    expect(new Set(sections.map((s) => s.key)).size).toBe(3);
    expect(sections[1].subtopicsText).toBe("flux\nrapport");
  });
});

describe("édition", () => {
  it("updateSection ne modifie que la section ciblée", () => {
    const sections = toEditable(plan);
    const updated = updateSection(sections, sections[1].key, { title: "Nouveau" });

    expect(titles(updated)).toEqual(["Introduction", "Nouveau", "Résumé"]);
    expect(sections[1].title).toBe("Principe");
  });

  it("removeSection retire la section", () => {
    const sections = toEditable(plan);
    expect(titles(removeSection(sections, sections[0].key))).toEqual(["Principe", "Résumé"]);
  });

  it("insertSection insère après la clé donnée, sinon en fin de liste", () => {
    const sections = toEditable(plan);
    const blank = createBlankSection();

    expect(insertSection(sections, blank, sections[0].key)[1]).toBe(blank);
    expect(insertSection(sections, blank).at(-1)).toBe(blank);
    expect(insertSection(sections, blank, "inconnue").at(-1)).toBe(blank);
  });

  it("moveSection échange avec le voisin et respecte les bornes", () => {
    const sections = toEditable(plan);

    expect(titles(moveSection(sections, sections[2].key, -1))).toEqual(["Introduction", "Résumé", "Principe"]);
    expect(titles(moveSection(sections, sections[0].key, 1))).toEqual(["Principe", "Introduction", "Résumé"]);
    expect(moveSection(sections, sections[0].key, -1)).toBe(sections);
    expect(moveSection(sections, sections[2].key, 1)).toBe(sections);
  });
});

describe("validatePlan", () => {
  it("accepte un plan valide", () => {
    expect(validatePlan(toEditable(plan))).toEqual([]);
  });

  it("refuse un plan vide", () => {
    expect(validatePlan([])).toEqual(["Le plan doit contenir au moins une section."]);
  });

  it("refuse un plan sans section de développement", () => {
    const sections = toEditable(plan.filter((s) => s.type !== "development"));
    expect(validatePlan(sections)).toContain("Le plan doit contenir au moins une section de développement.");
  });

  it("refuse un titre vide (section vierge ajoutée)", () => {
    const sections = insertSection(toEditable(plan), createBlankSection());
    expect(validatePlan(sections)).toEqual(["Section 4 : le titre est obligatoire."]);
  });

  it("refuse plus de sections que le plafond", () => {
    const many = Array.from({ length: COURSE_PLAN_MAX_SECTIONS + 1 }, (_, i) => ({
      ...createBlankSection(),
      title: `Section ${i}`,
    }));
    expect(validatePlan(many)).toEqual([`Un plan ne peut pas dépasser ${COURSE_PLAN_MAX_SECTIONS} sections.`]);
  });

  it("refuse un sous-thème trop long", () => {
    const sections = toEditable(plan);
    const edited = updateSection(sections, sections[1].key, { subtopicsText: "x".repeat(301) });
    expect(validatePlan(edited)).toEqual(["Section 2 : sous-thème trop long (300 caractères max)."]);
  });
});

describe("toPlannedSections", () => {
  it("trim, retire les sous-thèmes vides et renumérote order de façon consécutive", () => {
    const sections = toEditable(plan);
    const edited = updateSection(removeSection(sections, sections[0].key), sections[1].key, {
      title: "  Principe modifié  ",
      subtopicsText: " flux \n\n  \nrapport\n",
    });

    expect(toPlannedSections(edited)).toEqual([
      { type: "development", title: "Principe modifié", objective: "Comprendre", subtopics: ["flux", "rapport"], order: 1 },
      { type: "summary", title: "Résumé", objective: "Retenir", subtopics: ["a"], order: 2 },
    ]);
  });
});

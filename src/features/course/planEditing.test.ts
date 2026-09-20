import { describe, expect, it } from "vitest";
import { COURSE_PLAN_MAX_SECTIONS } from "@/shared/utils/constants";
import {
  createBlankSection,
  insertGeneratedSections,
  insertSection,
  moveSection,
  removeSection,
  toAssistSections,
  toEditable,
  toPlannedSections,
  toSectionPatch,
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

describe("assistance IA", () => {
  it("toAssistSections nomme provisoirement les sections sans titre", () => {
    const sections = [...toEditable([plan[1]]), createBlankSection()];

    expect(titles(toAssistSections(sections))).toEqual(["Introduction", "Section 2 (sans titre)"]);
    expect(titles(toPlannedSections(sections))).toEqual(["Introduction", ""]);
  });

  it("toSectionPatch convertit une section complétée en champs d'édition, sans toucher au type", () => {
    const patch = toSectionPatch({
      type: "summary",
      title: "Titre",
      objective: "Obj",
      subtopics: ["a", "b"],
      order: 1,
    });

    expect(patch).toEqual({ title: "Titre", objective: "Obj", subtopicsText: "a\nb" });
  });

  it("insertGeneratedSections place les nouvelles sections après la dernière section de développement", () => {
    const sections = toEditable([
      ...plan,
      { type: "next_steps", title: "Suite", objective: "", subtopics: [], order: 4 },
    ]);
    const generated: PlannedSection[] = [
      { type: "development", title: "N1", objective: "", subtopics: [], order: 5 },
      { type: "development", title: "N2", objective: "", subtopics: [], order: 6 },
    ];

    const result = insertGeneratedSections(sections, generated);

    expect(titles(result)).toEqual(["Introduction", "Principe", "N1", "N2", "Résumé", "Suite"]);
  });

  it("insertGeneratedSections ajoute en fin de plan s'il n'y a aucune section de développement", () => {
    const sections = toEditable([plan[1]]);
    const generated: PlannedSection[] = [{ type: "development", title: "N1", objective: "", subtopics: [], order: 2 }];

    expect(titles(insertGeneratedSections(sections, generated))).toEqual(["Introduction", "N1"]);
  });

  it("insertGeneratedSections respecte le plafond de sections", () => {
    const full = Array.from({ length: COURSE_PLAN_MAX_SECTIONS - 1 }, () => createBlankSection());
    const generated: PlannedSection[] = [1, 2, 3].map((i) => ({
      type: "development",
      title: `N${i}`,
      objective: "",
      subtopics: [],
      order: i,
    }));

    const result = insertGeneratedSections(full, generated);

    expect(result).toHaveLength(COURSE_PLAN_MAX_SECTIONS);
    expect(result[result.length - 1].title).toBe("N1");
  });
});

import { describe, expect, it } from "vitest";
import {
  availableSections,
  chooseInitialSection,
  hasCourseBlock,
  isCourseSectionId,
  sectionForKey,
  type CourseSectionAvailability,
} from "./courseSections";

const all: CourseSectionAvailability = {
  hasQuestion: true,
  hasAnswer: true,
  hasPodcast: true,
  hasCourse: true,
  hasPitfalls: true,
  hasSummary: true,
  hasNextSteps: true,
};
const none: CourseSectionAvailability = {
  hasQuestion: false,
  hasAnswer: false,
  hasPodcast: false,
  hasCourse: false,
  hasPitfalls: false,
  hasSummary: false,
  hasNextSteps: false,
};
const ids = (a: Partial<CourseSectionAvailability>) => availableSections({ ...none, ...a }).map((s) => s.id);

describe("availableSections", () => {
  it("toutes les sections, dans l'ordre", () => {
    expect(availableSections(all).map((s) => s.id)).toEqual([
      "question",
      "podcast",
      "course",
      "pitfalls",
      "summary",
      "next-steps",
    ]);
  });
  it("retire les blocs sans donnée", () => {
    expect(ids({ hasCourse: true, hasSummary: true })).toEqual(["course", "summary"]);
    expect(ids({})).toEqual([]);
  });
  it("la réponse seule suffit pour le bloc Question", () => {
    expect(ids({ hasAnswer: true })).toEqual(["question"]);
    expect(ids({ hasQuestion: true })).toEqual(["question"]);
  });
});

describe("chooseInitialSection", () => {
  const available = availableSections({ ...none, hasCourse: true, hasSummary: true });
  it("reprend l'onglet mémorisé s'il est disponible", () => {
    expect(chooseInitialSection("summary", available)).toBe("summary");
  });
  it("sinon Cours (mémorisé absent, invalide ou indisponible)", () => {
    expect(chooseInitialSection(null, available)).toBe("course");
    expect(chooseInitialSection("pitfalls", available)).toBe("course");
    expect(chooseInitialSection("nope", available)).toBe("course");
  });
  it("sans Cours : le premier disponible", () => {
    expect(chooseInitialSection(null, availableSections({ ...none, hasSummary: true }))).toBe("summary");
  });
});

describe("sectionForKey", () => {
  const available = availableSections(all);
  it("flèches en boucle, vertical et horizontal", () => {
    expect(sectionForKey("question", "ArrowDown", available)).toBe("podcast");
    expect(sectionForKey("next-steps", "ArrowDown", available)).toBe("question");
    expect(sectionForKey("question", "ArrowUp", available)).toBe("next-steps");
    expect(sectionForKey("course", "ArrowRight", available)).toBe("pitfalls");
    expect(sectionForKey("course", "ArrowLeft", available)).toBe("podcast");
  });
  it("Début, Fin et autres touches", () => {
    expect(sectionForKey("course", "Home", available)).toBe("question");
    expect(sectionForKey("course", "End", available)).toBe("next-steps");
    expect(sectionForKey("course", "a", available)).toBeNull();
    expect(sectionForKey("course", "Home", [])).toBeNull();
  });
  it("ne sort pas de la liste disponible", () => {
    const some = availableSections({ ...none, hasCourse: true, hasSummary: true });
    expect(sectionForKey("course", "ArrowDown", some)).toBe("summary");
    expect(sectionForKey("summary", "ArrowDown", some)).toBe("course");
  });
});

describe("isCourseSectionId", () => {
  it("valide les ids connus", () => {
    expect(isCourseSectionId("next-steps")).toBe(true);
    expect(isCourseSectionId("lessons")).toBe(false);
    expect(isCourseSectionId(null)).toBe(false);
  });
});

describe("bloc par défaut d'un cours en réponse ciblée", () => {
  it("sans section ni quiz, avec une réponse : « Cours » est absent et on ouvre « Question »", () => {
    const hasCourse = hasCourseBlock({ sectionCount: 0, hasQuiz: false, hasAnswer: true });
    expect(hasCourse).toBe(false);
    const available = availableSections({
      hasQuestion: false,
      hasAnswer: true,
      hasPodcast: true,
      hasCourse,
      hasPitfalls: false,
      hasSummary: false,
      hasNextSteps: false,
    });
    expect(chooseInitialSection(null, available)).toBe("question");
  });
  it("avec des sections, un quiz ou sans réponse, « Cours » reste présent", () => {
    expect(hasCourseBlock({ sectionCount: 3, hasQuiz: false, hasAnswer: true })).toBe(true);
    expect(hasCourseBlock({ sectionCount: 0, hasQuiz: true, hasAnswer: true })).toBe(true);
    expect(hasCourseBlock({ sectionCount: 0, hasQuiz: false, hasAnswer: false })).toBe(true);
  });
});

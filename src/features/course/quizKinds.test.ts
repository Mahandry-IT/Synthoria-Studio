import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { quizQuestionSchema } from "./course.schema";
import { QuizQuestionMatching } from "./components/QuizQuestionMatching";
import { QuizQuestionNumeric } from "./components/QuizQuestionNumeric";
import { CourseTabs } from "./components/CourseTabs";
import { chooseInitialTab, tabForKey } from "./courseTabs";

describe("lecture des questions", () => {
  it("une ancienne question sans kind reste un choix", () => {
    const q = quizQuestionSchema.parse({ question: "Q", options: ["A", "B"], correct_option_indices: [0] });
    expect(q.kind).toBe("choice");
    expect(q.options).toEqual(["A", "B"]);
  });

  it("un kind inconnu retombe sur choice", () => {
    expect(quizQuestionSchema.parse({ question: "Q", options: ["A", "B"], kind: "drag_drop" }).kind).toBe("choice");
  });

  it("lit une question numérique et un appariement", () => {
    const n = quizQuestionSchema.parse({ kind: "numeric", question: "Q", options: [], expected_value: null, unit: "m" });
    expect(n).toMatchObject({ kind: "numeric", expected_value: null, unit: "m", options: [] });
    const m = quizQuestionSchema.parse({
      kind: "matching",
      question: "Q",
      subjects: ["a", "b", "c"],
      options: ["x", "y", "z"],
      correct_matches: [],
    });
    expect(m.subjects).toHaveLength(3);
  });
});

describe("rendu statique", () => {
  it("numérique : label, unité et description accessibles", () => {
    const html = renderToStaticMarkup(
      createElement(QuizQuestionNumeric, { question: { unit: "m/s" }, value: "1,5", onChange: () => {} }),
    );
    expect(html).toContain("<label");
    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain("m/s");
    expect(html).toContain("aria-describedby");
    expect(html).toContain('value="1,5"');
  });

  it("appariement : un select par sujet, options prises retirées des autres lignes", () => {
    const html = renderToStaticMarkup(
      createElement(QuizQuestionMatching, {
        question: { subjects: ["S1", "S2"], options: ["Opt A", "Opt B"] },
        selections: [0, null],
        onChange: () => {},
      }),
    );
    const selects = html.split("<select").slice(1);
    expect(selects).toHaveLength(2);
    expect(selects[0]).toContain("Opt A");
    expect(selects[1]).not.toContain("Opt A");
    expect(selects[1]).toContain("Opt B");
    expect(selects[1]).toContain("—");
  });
});

describe("onglets du cours", () => {
  const html = renderToStaticMarkup(
    createElement(CourseTabs, {
      active: "lessons",
      onChange: () => {},
      panels: { lessons: "L", exercises: "E", quiz: "Q" },
    }),
  );

  it("structure ARIA", () => {
    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(3);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('aria-controls="course-panel-quiz"');
    expect(html).toContain('aria-labelledby="course-tab-quiz"');
  });

  it("seul le panneau actif est rendu", () => {
    expect(html).toContain(">L<");
    expect(html).not.toContain(">E<");
  });

  it("onglet initial : mémorisé si valide, sinon Leçons", () => {
    expect(chooseInitialTab(null, true)).toBe("lessons");
    expect(chooseInitialTab("inconnu", true)).toBe("lessons");
    expect(chooseInitialTab("exercises", false)).toBe("exercises");
    expect(chooseInitialTab("quiz", true)).toBe("quiz");
    expect(chooseInitialTab("quiz", false)).toBe("lessons");
  });

  it("navigation clavier en boucle", () => {
    expect(tabForKey("lessons", "ArrowRight")).toBe("exercises");
    expect(tabForKey("lessons", "ArrowLeft")).toBe("quiz");
    expect(tabForKey("quiz", "ArrowRight")).toBe("lessons");
    expect(tabForKey("exercises", "Enter")).toBeNull();
  });
});

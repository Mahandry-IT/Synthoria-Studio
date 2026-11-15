import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { availableSections } from "../courseSections";
import { CourseIconNav } from "./CourseIconNav";

const none = {
  hasQuestion: false,
  hasAnswer: false,
  hasPodcast: false,
  hasCourse: false,
  hasPitfalls: false,
  hasSummary: false,
  hasNextSteps: false,
};

describe("CourseIconNav (rendu statique)", () => {
  const sections = availableSections({ ...none, hasCourse: true, hasSummary: true, hasPodcast: true });
  const out = renderToStaticMarkup(h(CourseIconNav, { sections, active: "course", onChange: () => {} }));

  it("un tablist, un tab par section disponible avec libellé", () => {
    expect(out).toContain('role="tablist"');
    expect(out.match(/role="tab"/g)).toHaveLength(3);
    for (const label of ["Podcast", "Cours", "Résumé"]) expect(out).toContain(`aria-label="${label}"`);
  });

  it("sections absentes non rendues", () => {
    for (const label of ["Question", "Pièges", "Suite"]) expect(out).not.toContain(`aria-label="${label}"`);
  });

  it("aria-selected, aria-controls et tabindex itinérant", () => {
    expect(out.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(out).toContain('aria-controls="course-section-panel-course"');
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it("barre basse mobile avec marge de sécurité, colonne collante desktop, cible 44 px", () => {
    expect(out).toContain("env(safe-area-inset-bottom)");
    expect(out).toContain("lg:sticky");
    expect(out).toContain("lg:min-h-11");
  });
});

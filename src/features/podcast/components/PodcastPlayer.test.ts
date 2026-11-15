import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PodcastPlayer } from "./PodcastPlayer";

const JOB_ID = "123e4567-e89b-42d3-a456-426614174000";
const render = (props: Partial<Parameters<typeof PodcastPlayer>[0]> = {}) =>
  renderToStaticMarkup(createElement(PodcastPlayer, { jobId: JOB_ID, title: "Cours <b>x</b>", durationSeconds: 754, ...props }));

describe("PodcastPlayer (rendu statique)", () => {
  it("expose les boutons avec leurs libellés français", () => {
    const html = render();
    for (const label of [
      "Reculer de 10 secondes",
      "Revenir au début",
      "Lire",
      "Aller à la fin",
      "Avancer de 10 secondes",
    ]) {
      expect(html).toContain(`aria-label="${label}"`);
    }
    expect(html).not.toContain("aria-pressed");
  });

  it("n'utilise plus les contrôles natifs mais garde preload=none, la piste et le téléchargement", () => {
    const html = render();
    expect(html).not.toMatch(/<audio[^>]*\scontrols/);
    expect(html).toContain('preload="none"');
    expect(html).toContain("<track");
    expect(html).toContain(`href="/api/podcasts/${JOB_ID}/audio" download`);
  });

  it("affiche la durée, un slider de position et échappe le titre", () => {
    const html = render();
    expect(html).toContain("12:34");
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuemax="754"');
    expect(html).not.toContain("<b>x</b>");
  });

  it("fonctionne sans durée connue", () => {
    const html = render({ durationSeconds: null, title: undefined });
    expect(html).toContain("--:--");
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-label="Lire"');
  });

  it("refuse un identifiant invalide", () => {
    expect(() => render({ jobId: "../etc/passwd" })).toThrow();
  });
});

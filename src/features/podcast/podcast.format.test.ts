import { describe, expect, it } from "vitest";
import { formatDuration, podcastStatusMeta } from "./podcast.format";

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [59.6, "1:00"],
    [65, "1:05"],
    [754, "12:34"],
    [3725, "1:02:05"],
  ])("%s s → %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it.each([null, undefined, -1, Number.NaN, Number.POSITIVE_INFINITY])("durée inconnue (%s) → chaîne vide", (value) => {
    expect(formatDuration(value)).toBe("");
  });
});

describe("podcastStatusMeta", () => {
  it("fournit libellé, variante et icône pour chaque statut (jamais la couleur seule)", () => {
    for (const status of ["pending", "scripting", "synthesizing", "mixing", "done", "failed"] as const) {
      const meta = podcastStatusMeta(status);
      expect(meta.label).not.toBe("");
      expect(meta.icon).not.toBe("");
    }
    expect(podcastStatusMeta("done").variant).toBe("green");
    expect(podcastStatusMeta("failed").variant).toBe("red");
  });
});

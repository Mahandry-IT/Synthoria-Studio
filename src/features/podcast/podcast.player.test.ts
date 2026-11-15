import { describe, expect, it } from "vitest";
import {
  activeBarIndex,
  clampTime,
  formatClock,
  jumpToEnd,
  peaksFromSamples,
  skipForKey,
  skipBy,
  timeFromRatio,
  waveformBars,
  waveformKeyTarget,
} from "./podcast.player";

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [5.9, "0:05"],
    [65, "1:05"],
    [3599, "59:59"],
    [3725, "1:02:05"],
    [Number.NaN, "0:00"],
    [-3, "0:00"],
    [Number.POSITIVE_INFINITY, "0:00"],
  ])("%s → %s", (seconds, expected) => {
    expect(formatClock(seconds)).toBe(expected);
  });
});

describe("clampTime / skipBy", () => {
  it("borne dans [0, durée]", () => {
    expect(clampTime(-5, 100)).toBe(0);
    expect(clampTime(150, 100)).toBe(100);
    expect(clampTime(40, 100)).toBe(40);
  });
  it("tolère une durée NaN ou infinie", () => {
    expect(clampTime(40, Number.NaN)).toBe(40);
    expect(clampTime(40, Number.POSITIVE_INFINITY)).toBe(40);
    expect(clampTime(-1, Number.NaN)).toBe(0);
    expect(clampTime(Number.NaN, 100)).toBe(0);
  });
  it("saute en avant et en arrière sans dépasser", () => {
    expect(skipBy(50, 10, 100)).toBe(60);
    expect(skipBy(5, -10, 100)).toBe(0);
    expect(skipBy(95, 10, 100)).toBe(100);
    expect(skipBy(Number.NaN, 10, 100)).toBe(10);
  });
});

describe("précédent / suivant", () => {
  it("suivant saute à la fin, ou reste en place sans durée", () => {
    expect(jumpToEnd(10, 120)).toBe(120);
    expect(jumpToEnd(10, Number.NaN)).toBe(10);
  });
});

describe("waveformBars", () => {
  it("est déterministe et dans [0.15, 1]", () => {
    const a = waveformBars("job-1", 32);
    expect(a).toEqual(waveformBars("job-1", 32));
    expect(a).toHaveLength(32);
    expect(a.every((v) => v >= 0.15 && v <= 1)).toBe(true);
  });
  it("varie selon la graine", () => {
    expect(waveformBars("job-1", 32)).not.toEqual(waveformBars("job-2", 32));
  });
});

describe("peaksFromSamples", () => {
  it("normalise les pics entre 0 et 1", () => {
    const peaks = peaksFromSamples(Float32Array.from([0.1, -0.2, 0.4, -0.8]), 2);
    expect(peaks[0]).toBeCloseTo(0.25);
    expect(peaks[1]).toBe(1);
  });
  it("gère le silence et l'absence de données", () => {
    expect(peaksFromSamples(new Float32Array(10), 4)).toEqual([0, 0, 0, 0]);
    expect(peaksFromSamples(new Float32Array(0), 3)).toEqual([0, 0, 0]);
  });
  it("gère moins d'échantillons que de barres", () => {
    const peaks = peaksFromSamples(Float32Array.from([0.5]), 4);
    expect(peaks).toHaveLength(4);
    expect(Math.max(...peaks)).toBe(1);
  });
});

describe("activeBarIndex", () => {
  it("retourne -1 sans lecture ni durée", () => {
    expect(activeBarIndex(0, 100, 10)).toBe(-1);
    expect(activeBarIndex(10, Number.NaN, 10)).toBe(-1);
    expect(activeBarIndex(10, 0, 10)).toBe(-1);
  });
  it("suit la progression et reste borné", () => {
    expect(activeBarIndex(10, 100, 10)).toBe(0);
    expect(activeBarIndex(50, 100, 10)).toBe(4);
    expect(activeBarIndex(100, 100, 10)).toBe(9);
    expect(activeBarIndex(500, 100, 10)).toBe(9);
  });
});

describe("timeFromRatio", () => {
  it("convertit et borne", () => {
    expect(timeFromRatio(0.5, 80)).toBe(40);
    expect(timeFromRatio(2, 80)).toBe(80);
    expect(timeFromRatio(-1, 80)).toBe(0);
    expect(timeFromRatio(0.5, Number.NaN)).toBe(0);
  });
});

describe("raccourcis clavier", () => {
  it("le slider avance et recule de 5 s, Début et Fin vont aux bornes", () => {
    expect(waveformKeyTarget("ArrowRight", 10, 100)).toBe(15);
    expect(waveformKeyTarget("ArrowDown", 10, 100)).toBe(5);
    expect(waveformKeyTarget("Home", 10, 100)).toBe(0);
    expect(waveformKeyTarget("End", 10, 100)).toBe(100);
    expect(waveformKeyTarget("a", 10, 100)).toBeNull();
  });
  it("le lecteur saute de 10 s avec les flèches gauche et droite seulement", () => {
    expect(skipForKey("ArrowLeft")).toBe(-10);
    expect(skipForKey("ArrowRight")).toBe(10);
    expect(skipForKey("ArrowUp")).toBeNull();
  });
});

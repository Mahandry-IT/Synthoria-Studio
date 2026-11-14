import { describe, expect, it } from "vitest";
import { clampZoom, nextZoom } from "./diagramZoom";

describe("zoom du schéma", () => {
  it("borne entre 50 et 300", () => {
    expect(clampZoom(10)).toBe(50);
    expect(clampZoom(999)).toBe(300);
    expect(clampZoom(150)).toBe(150);
    expect(clampZoom(Number.NaN)).toBe(100);
  });

  it("avance par pas de 25 sans dépasser les bornes", () => {
    expect(nextZoom(100, 1)).toBe(125);
    expect(nextZoom(100, -1)).toBe(75);
    expect(nextZoom(300, 1)).toBe(300);
    expect(nextZoom(50, -1)).toBe(50);
  });
});

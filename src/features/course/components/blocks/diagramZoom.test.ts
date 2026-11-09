import { describe, expect, it } from "vitest";
import { MERMAID_CONFIG } from "./mermaidConfig";
import { clampZoom, nextZoom } from "./diagramZoom";

describe("MERMAID_CONFIG", () => {
  it("utilise le thème base avec l'accent indigo et reste sûr", () => {
    expect(MERMAID_CONFIG.theme).toBe("base");
    expect(MERMAID_CONFIG.themeVariables.primaryBorderColor).toBe("#4f46e5");
    expect(MERMAID_CONFIG.themeVariables.edgeLabelBackground).toBe("#ffffff");
    expect(MERMAID_CONFIG.flowchart.htmlLabels).toBe(false);
    expect(MERMAID_CONFIG.securityLevel).toBe("strict");
  });
});

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

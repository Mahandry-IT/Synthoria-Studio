import { describe, expect, it } from "vitest";
import { stripStyleDirectives } from "./diagramSvg";

describe("stripStyleDirectives", () => {
  it("retire une directive style qui fait buter le parseur Mermaid (bug reproduit)", () => {
    const source =
      "flowchart TD; A[Nœud 1] -->|Action A| B[Résultat]; C[Nœud 2] -->|Action A| D[Résultat]; " +
      "subpath[Ensemble d'information]:::style; style subpath fill:#f9f,stroke:#333,stroke-width:2px";

    expect(stripStyleDirectives(source)).toBe(
      "flowchart TD; A[Nœud 1] -->|Action A| B[Résultat]; C[Nœud 2] -->|Action A| D[Résultat]; " +
        "subpath[Ensemble d'information];",
    );
  });

  it("retire classDef et class, même quand le nom de classe est le mot réservé « style »", () => {
    const source = "flowchart TD\nA[Entrée] --> B[Sortie]\nclassDef myclass fill:#f9f\nclass A style";

    expect(stripStyleDirectives(source)).toBe("flowchart TD\nA[Entrée] --> B[Sortie]");
  });

  it("ne touche pas à un libellé de nœud contenant le mot « style »", () => {
    const source = "flowchart TD\nA[Style de vie] --> B[Résultat]";

    expect(stripStyleDirectives(source)).toBe(source);
  });

  it("laisse un diagramme sans directive de style intact", () => {
    const source = "flowchart TD\nA[Entrée] --> B{Test}\nB -->|oui| C[Sortie]";

    expect(stripStyleDirectives(source)).toBe(source);
  });

  it("laisse un sequenceDiagram intact (aucune directive de style)", () => {
    const source = "sequenceDiagram\nClient->>Serveur: requête\nServeur-->>Client: réponse";

    expect(stripStyleDirectives(source)).toBe(source);
  });
});

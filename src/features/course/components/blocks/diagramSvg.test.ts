import { describe, expect, it } from "vitest";
import { quoteFlowchartLabels, stripStyleDirectives } from "./diagramSvg";

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

describe("quoteFlowchartLabels", () => {
  it("met entre guillemets un libellé avec parenthèses (bug reproduit : f(s1) rendait tout le schéma invalide)", () => {
    const source =
      "flowchart TD; A[Solution Actuelle s] -->|Opérateur de voisinage| B(Voisin s1); B --> D[Évaluation f(s1)]; " +
      "D --> F{Sélection}; E[Évaluation f(s2)] --> F;";

    expect(quoteFlowchartLabels(source)).toBe(
      'flowchart TD; A[Solution Actuelle s] -->|Opérateur de voisinage| B(Voisin s1); B --> D["Évaluation f(s1)"]; ' +
        'D --> F{Sélection}; E["Évaluation f(s2)"] --> F;',
    );
  });

  it("gère les losanges et les libellés d'arête avec parenthèses", () => {
    expect(quoteFlowchartLabels("flowchart TD\nA{f(x) > 0} -->|oui (cas 1)| B[Fin]")).toBe(
      'flowchart TD\nA{"f(x) > 0"} -->|"oui (cas 1)"| B[Fin]',
    );
  });

  it("laisse intacts les libellés déjà entre guillemets, sans parenthèses et les formes spéciales", () => {
    const source = 'flowchart TD\nA["f(x)"] --> B[Texte simple]\nB --> C[(Base de données)]\nC --> D[[Sous-programme]]';

    expect(quoteFlowchartLabels(source)).toBe(source);
  });

  it("ne touche pas aux autres types de diagrammes", () => {
    const source = "sequenceDiagram\nClient->>Serveur: appel f(x)";

    expect(quoteFlowchartLabels(source)).toBe(source);
  });
});

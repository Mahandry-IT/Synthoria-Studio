/**
 * Retire les directives de style de la source Mermaid (`style ...`, `classDef ...`, `class ...`,
 * et le raccourci `:::nomDeClasse` accroché à un nœud) avant de la passer à Mermaid.
 *
 * Deux raisons, l'une bloquante et l'autre défensive :
 * - Nommer une classe/un nœud « style » (ex. `:::style` suivi d'une vraie directive `style ...`)
 *   fait buter le parseur Mermaid dessus (« got STYLE » au lieu du token attendu) : tout le
 *   diagramme échoue et s'affiche en texte brut. Reproduit et confirmé avec un rendu réel.
 * - Ces directives sont le seul endroit où la source d'un diagramme (texte du modèle, non fiable)
 *   peut injecter des valeurs CSS arbitraires dans le `<style>` que Mermaid émet — `<style>` est
 *   déjà laissé passer par notre sanitizer (voir `sanitizeSvg` plus bas) en s'appuyant sur DOMPurify
 *   pour le contenu *généré par Mermaid lui-même* ; ça ne couvre pas des valeurs que la source du
 *   diagramme viendrait injecter via ces directives. Les retirer ferme cet interstice sans rien
 *   perdre : la consigne donnée au modèle est déjà de ne jamais utiliser de directives de style.
 *
 * @example stripStyleDirectives("flowchart TD\nA-->B\nstyle A fill:#f00") // "flowchart TD\nA-->B"
 */
export function stripStyleDirectives(source: string): string {
  return source
    .replace(/(^|[;\n])\s*(style|classDef|class)\s[^;\n]*/g, "$1")
    .replace(/:::[A-Za-z0-9_-]+(,[A-Za-z0-9_-]+)*/g, "")
    .replace(/;\s*;/g, ";")
    .trim();
}

/**
 * Éléments SVG jamais acceptés dans un schéma généré par un LLM (contenu non fiable).
 *
 * `style` et `foreignobject` sont volontairement absents : `DiagramBlock` appelle Mermaid avec
 * `securityLevel: "strict"`, ce qui fait passer tout le SVG rendu par DOMPurify *avant* qu'on le
 * reçoive (voir `mermaid.core.mjs`, `renderDiagram` → `DOMPurify.sanitize(code2, { ADD_TAGS:
 * ["foreignobject"], HTML_INTEGRATION_POINTS: { foreignobject: true } })`) — la configuration
 * officiellement documentée par DOMPurify pour assainir du HTML dans un `foreignObject` SVG (le
 * contenu y est nettoyé comme du HTML, pas laissé tel quel). `style` fait déjà partie de la liste
 * blanche SVG par défaut de DOMPurify (du CSS, ça n'exécute pas de JavaScript).
 * Les bloquer ici en plus cassait TOUT rendu Mermaid : `style` porte tout le remplissage/contour
 * des formes (sans lui, remplissage SVG par défaut = noir, qui recouvre le texte) et
 * `foreignobject` porte le texte de chaque libellé (sans lui, aucun texte, sur aucun diagramme).
 * On garde ce filtre pour les vecteurs que DOMPurify ne laisserait jamais passer de toute façon.
 */
const FORBIDDEN_TAGS = new Set(["script", "iframe", "object", "embed", "link", "a"]);

/**
 * Nettoie un SVG produit par Mermaid avant insertion dans le DOM : retire les balises actives,
 * les gestionnaires `on*` et les URL `javascript:`. Défense en profondeur en plus du
 * `securityLevel: "strict"` de Mermaid.
 *
 * @returns le nœud `<svg>` nettoyé, ou `null` si la source n'est pas un SVG valide.
 */
export function sanitizeSvg(svg: string): SVGSVGElement | null {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return null;

  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (FORBIDDEN_TAGS.has(child.nodeName.toLowerCase())) {
        child.remove();
        continue;
      }
      walk(child);
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:") || (name.endsWith("href") && !value.startsWith("#"))) {
        el.removeAttribute(attr.name);
      }
    }
  };
  walk(root);
  return document.importNode(root, true) as unknown as SVGSVGElement;
}

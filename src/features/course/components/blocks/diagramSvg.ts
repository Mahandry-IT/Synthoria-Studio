/** Éléments SVG jamais acceptés dans un schéma généré par un LLM (contenu non fiable). */
const FORBIDDEN_TAGS = new Set(["script", "foreignobject", "iframe", "object", "embed", "style", "link", "a"]);

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

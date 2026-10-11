import { describe, expect, it } from "vitest";
import type { CourseGraph } from "../../course.types";
import { edgeGeometry, layoutGraph, loopGeometry, truncateLabel, validEdges } from "./graphGeometry";

const graph = (layout: CourseGraph["layout"], ids: string[], pairs: [string, string][]): CourseGraph => ({
  layout,
  directed: true,
  nodes: ids.map((id) => ({ id, label: id })),
  edges: pairs.map(([source, target], i) => ({ id: `e${i}`, source, target })),
});

const at = (g: CourseGraph, id: string) => {
  const point = layoutGraph(g).positions.get(id);
  if (!point) throw new Error(`nœud ${id} non placé`);
  return point;
};

function expectInsideAndDistinct(g: CourseGraph) {
  const { positions, width, height, rx, ry } = layoutGraph(g);
  const points = [...positions.values()];
  expect(points).toHaveLength(g.nodes.length);
  for (const { x, y } of points) {
    expect(x - rx).toBeGreaterThanOrEqual(0);
    expect(x + rx).toBeLessThanOrEqual(width);
    expect(y - ry).toBeGreaterThanOrEqual(0);
    expect(y + ry).toBeLessThanOrEqual(height);
  }
  expect(new Set(points.map((p) => `${p.x};${p.y}`)).size).toBe(points.length);
}

describe("layoutGraph", () => {
  const tree = graph("tree", ["A", "B", "C", "D", "E"], [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"]]);

  it("dispose un arbre par niveaux, le parent centré sur ses enfants", () => {
    expect(at(tree, "B").y).toBe(at(tree, "C").y);
    expect(at(tree, "D").y).toBeGreaterThan(at(tree, "B").y);
    expect(at(tree, "B").x).toBeCloseTo((at(tree, "D").x + at(tree, "E").x) / 2);
    expect(at(tree, "A").x).toBeCloseTo((at(tree, "B").x + at(tree, "C").x) / 2);
    expectInsideAndDistinct(tree);
  });

  it("place chaque nœud d'un graphe en niveaux sous sa plus longue chaîne de dépendances", () => {
    const layered = graph("layered", ["A", "B", "C", "D"], [["A", "B"], ["B", "C"], ["A", "C"], ["A", "D"]]);

    expect(at(layered, "B").y).toBe(at(layered, "D").y);
    expect(at(layered, "C").y).toBeGreaterThan(at(layered, "B").y); // A→B→C l'emporte sur A→C
    expectInsideAndDistinct(layered);
  });

  it("dispose un graphe général sur un cercle, jusqu'à 20 nœuds sans chevauchement", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `n${i}`);
    const ring = graph("graph", ids, ids.map((id, i) => [id, ids[(i + 1) % ids.length]]));
    const { positions, rx } = layoutGraph(ring);

    expectInsideAndDistinct(ring);
    const [first, second] = [positions.get("n0")!, positions.get("n1")!];
    expect(Math.hypot(second.x - first.x, second.y - first.y)).toBeGreaterThan(rx * 2);
  });

  it("se replie sur le cercle quand la structure annoncée est fausse", () => {
    const cyclic = graph("layered", ["A", "B", "C"], [["A", "B"], ["B", "C"], ["C", "A"]]);
    const twoRoots = graph("tree", ["A", "B", "C"], [["A", "B"]]);
    const cyclicTree = graph("tree", ["R", "A", "B"], [["A", "B"], ["B", "A"]]);

    for (const g of [cyclic, twoRoots, cyclicTree]) expectInsideAndDistinct(g);
  });

  it("ignore une arête orpheline et un identifiant en double", () => {
    const g = graph("tree", ["A", "B", "B"], [["A", "B"], ["A", "Z"], ["__proto__", "A"]]);

    expect(validEdges(g)).toHaveLength(1);
    expect(layoutGraph(g).positions.size).toBe(2);
  });

  it("élargit les nœuds pour un libellé long, dans la limite prévue", () => {
    const short = graph("graph", ["A", "B"], [["A", "B"]]);
    const long = { ...short, nodes: [{ id: "A", label: "x".repeat(200) }, { id: "B", label: "B" }] };

    expect(layoutGraph(long).rx).toBeGreaterThan(layoutGraph(short).rx);
    expect(layoutGraph(long).rx).toBeLessThanOrEqual(56);
  });
});

describe("edgeGeometry", () => {
  const size = { rx: 22, ry: 22 };

  it("arrête le tracé au bord des nœuds", () => {
    const { d, label } = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, size);

    expect(d).toBe("M 22 0 Q 50 0 78 0");
    expect(label.y).toBe(0);
    expect(label.x).toBeGreaterThan(22);
    expect(label.x).toBeLessThan(78);
  });

  it("courbe en sens opposés les deux arêtes d'un aller-retour", () => {
    const go = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 0 }, size, true);
    const back = edgeGeometry({ x: 100, y: 0 }, { x: 0, y: 0 }, size, true);

    expect(go.label.y * back.label.y).toBeLessThan(0);
  });

  it("dessine une boucle au-dessus d'un nœud relié à lui-même", () => {
    const { d, label } = edgeGeometry({ x: 50, y: 100 }, { x: 50, y: 100 }, size);

    expect(d).toContain(" C ");
    expect(d).not.toContain("NaN");
    expect(label).toEqual({ x: 50, y: 100 - size.ry - 38 });
  });

  it("oriente la boucle à l'opposé du centre du dessin", () => {
    const { label } = loopGeometry({ x: 200, y: 100 }, { x: 100, y: 100 }, size);

    expect(label.y).toBe(100);
    expect(label.x).toBeGreaterThan(200 + size.rx);
  });
});

describe("truncateLabel", () => {
  it("coupe un libellé trop long et laisse les autres intacts", () => {
    expect(truncateLabel("Dijkstra", 14)).toBe("Dijkstra");
    expect(truncateLabel("abcdefghij", 5)).toBe("abcd…");
  });
});

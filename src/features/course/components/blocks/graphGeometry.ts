import type { CourseGraph, CourseGraphEdge } from "../../course.types";

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphLayoutResult {
  width: number;
  height: number;
  /** Demi-axes communs à tous les nœuds (ellipses de même taille, calées sur le plus long libellé). */
  rx: number;
  ry: number;
  positions: Map<string, GraphPoint>;
}

export interface EdgeGeometry {
  /** Attribut `d` du tracé SVG, déjà raccourci au bord des nœuds. */
  d: string;
  label: GraphPoint;
}

/** Position logique d'un nœud : colonne (éventuellement fractionnaire) et niveau. */
interface Cell {
  slot: number;
  depth: number;
}

export const NODE_LABEL_MAX = 14;
export const EDGE_LABEL_MAX = 12;

const NODE_RY = 22;
const MIN_RX = 22;
const MAX_RX = 56;
const CHAR_HALF_WIDTH = 3.5;
const LABEL_PADDING = 8;
const NODE_GAP = 24;
/** Écart entre voisins sur le cercle : assez large pour une arête et son étiquette. */
const CIRCLE_GAP = 60;
const LEVEL_GAP = 84;
const PADDING = 44;
const CURVE_OFFSET = 22;
const LOOP_REACH = 38;
const LOOP_SPREAD = 30;
const LOOP_FOOT = 12;
/** Position de l'étiquette le long de l'arête : décalée du milieu pour limiter les superpositions au centre. */
const LABEL_T = 0.42;

const round = (value: number) => Math.round(value * 10) / 10;

/** Tronque un libellé trop long pour sa place (le libellé complet reste disponible en infobulle). */
export function truncateLabel(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : text;
}

function nodeRadiusX(graph: CourseGraph): number {
  const longest = Math.max(0, ...graph.nodes.map((n) => Math.min([...n.label].length, NODE_LABEL_MAX)));
  return Math.min(Math.max(longest * CHAR_HALF_WIDTH + LABEL_PADDING, MIN_RX), MAX_RX);
}

/** Arbre enraciné : feuilles en colonnes successives, parent centré sur ses enfants. `null` si ce n'en est pas un. */
function treeCells(ids: string[], edges: CourseGraphEdge[]): Map<string, Cell> | null {
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const edge of edges) {
    if (edge.source === edge.target) return null;
    children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
    hasParent.add(edge.target);
  }
  const roots = ids.filter((id) => !hasParent.has(id));
  if (roots.length !== 1) return null;

  const cells = new Map<string, Cell>();
  let nextLeaf = 0;
  const place = (id: string, depth: number): number => {
    const cell: Cell = { slot: 0, depth };
    cells.set(id, cell); // marqué avant la descente : un cycle ne peut pas boucler
    const slots: number[] = [];
    for (const child of children.get(id) ?? []) {
      if (!cells.has(child)) slots.push(place(child, depth + 1));
    }
    cell.slot = slots.length > 0 ? (slots[0] + slots[slots.length - 1]) / 2 : nextLeaf++;
    return cell.slot;
  };
  place(roots[0], 0);
  return cells.size === ids.length ? cells : null;
}

/** Niveaux de dépendance : niveau = plus long chemin depuis une source. `null` si le graphe a un cycle. */
function layeredCells(ids: string[], edges: CourseGraphEdge[]): Map<string, Cell> | null {
  const indegree = new Map(ids.map((id) => [id, 0]));
  const targets = new Map<string, string[]>();
  for (const edge of edges) {
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    targets.set(edge.source, [...(targets.get(edge.source) ?? []), edge.target]);
  }

  const level = new Map(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => indegree.get(id) === 0);
  for (let i = 0; i < queue.length; i++) {
    for (const target of targets.get(queue[i]) ?? []) {
      level.set(target, Math.max(level.get(target) ?? 0, (level.get(queue[i]) ?? 0) + 1));
      const remaining = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, remaining);
      if (remaining === 0) queue.push(target);
    }
  }
  if (queue.length !== ids.length) return null;

  const rows: string[][] = [];
  for (const id of ids) (rows[level.get(id) ?? 0] ??= []).push(id);
  const widest = Math.max(...rows.map((row) => row.length));
  const cells = new Map<string, Cell>();
  rows.forEach((row, depth) =>
    row.forEach((id, i) => cells.set(id, { slot: i + (widest - row.length) / 2, depth })),
  );
  return cells;
}

function gridLayout(cells: Map<string, Cell>, rx: number): GraphLayoutResult {
  const step = rx * 2 + NODE_GAP;
  const all = [...cells.values()];
  const positions = new Map<string, GraphPoint>();
  for (const [id, cell] of cells) {
    positions.set(id, {
      x: round(PADDING + rx + cell.slot * step),
      y: round(PADDING + NODE_RY + cell.depth * LEVEL_GAP),
    });
  }
  return {
    width: round((PADDING + rx) * 2 + Math.max(...all.map((c) => c.slot)) * step),
    height: round((PADDING + NODE_RY) * 2 + Math.max(...all.map((c) => c.depth)) * LEVEL_GAP),
    rx,
    ry: NODE_RY,
    positions,
  };
}

/** Nœuds répartis sur un cercle, le premier en haut : déterministe et lisible jusqu'à 20 nœuds. */
function circleLayout(ids: string[], rx: number): GraphLayoutResult {
  const count = ids.length;
  const radius = count < 2 ? 0 : (rx * 2 + CIRCLE_GAP) / (2 * Math.sin(Math.PI / count));
  const cx = PADDING + rx + radius;
  const cy = PADDING + NODE_RY + radius;
  const positions = new Map<string, GraphPoint>();
  ids.forEach((id, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    positions.set(id, { x: round(cx + radius * Math.cos(angle)), y: round(cy + radius * Math.sin(angle)) });
  });
  return { width: round(cx * 2), height: round(cy * 2), rx, ry: NODE_RY, positions };
}

/** Arêtes dont les deux extrémités existent : les garanties du serveur ne sont pas tenues pour acquises. */
export function validEdges(graph: CourseGraph): CourseGraphEdge[] {
  const ids = new Set(graph.nodes.map((n) => n.id));
  return graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
}

/**
 * Calcule la position de chaque nœud et la taille du dessin, sans dépendance ni aléa.
 * `tree` et `layered` se replient sur le cercle si la structure ne s'y prête pas (racine absente, cycle).
 * @example layoutGraph({ layout: "tree", directed: true, nodes, edges }).positions.get("A") // { x, y }
 */
export function layoutGraph(graph: CourseGraph): GraphLayoutResult {
  const ids = [...new Set(graph.nodes.map((n) => n.id))];
  const edges = validEdges(graph);
  const rx = nodeRadiusX(graph);

  const cells =
    graph.layout === "tree" ? treeCells(ids, edges) : graph.layout === "layered" ? layeredCells(ids, edges) : null;
  return cells ? gridLayout(cells, rx) : circleLayout(ids, rx);
}

/** Point du bord de l'ellipse centrée en `center`, dans la direction de `toward`. */
function boundaryPoint(center: GraphPoint, toward: GraphPoint, rx: number, ry: number): GraphPoint {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const norm = Math.hypot(dx / rx, dy / ry);
  if (norm === 0) return center;
  const t = Math.min(1 / norm, 1);
  return { x: center.x + dx * t, y: center.y + dy * t };
}

const bezier = (a: number, control: number, b: number, t: number) =>
  (1 - t) ** 2 * a + 2 * (1 - t) * t * control + t ** 2 * b;

/**
 * Boucle d'un nœud sur lui-même (automates), dessinée à l'opposé de `away` pour ne pas croiser
 * les autres arêtes (le centre du dessin, dans une disposition en cercle).
 */
export function loopGeometry(center: GraphPoint, away: GraphPoint, size: Pick<GraphLayoutResult, "rx" | "ry">): EdgeGeometry {
  const distance = Math.hypot(center.x - away.x, center.y - away.y);
  // Vecteur unitaire vers l'extérieur (vers le haut si `away` est le nœud lui-même) et sa perpendiculaire.
  const u = distance === 0 ? { x: 0, y: -1 } : { x: (center.x - away.x) / distance, y: (center.y - away.y) / distance };
  const v = { x: -u.y, y: u.x };
  const edge = 1 / Math.hypot(u.x / size.rx, u.y / size.ry); // distance du centre au bord, dans la direction u
  const at = (along: number, across: number): GraphPoint => ({
    x: center.x + u.x * along + v.x * across,
    y: center.y + u.y * along + v.y * across,
  });

  const start = boundaryPoint(center, at(edge, -LOOP_FOOT), size.rx, size.ry);
  const end = boundaryPoint(center, at(edge, LOOP_FOOT), size.rx, size.ry);
  const c1 = at(edge + LOOP_REACH, -LOOP_SPREAD);
  const c2 = at(edge + LOOP_REACH, LOOP_SPREAD);
  const label = at(edge + LOOP_REACH, 0);
  return {
    d: `M ${round(start.x)} ${round(start.y)} C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(end.x)} ${round(end.y)}`,
    label: { x: round(label.x), y: round(label.y) },
  };
}

/**
 * Tracé d'une arête entre deux nœuds, arrêté à leur bord pour laisser la pointe de flèche visible.
 * @param curved - arête courbée, pour distinguer A→B de B→A dans un graphe orienté
 */
export function edgeGeometry(
  from: GraphPoint,
  to: GraphPoint,
  size: Pick<GraphLayoutResult, "rx" | "ry">,
  curved = false,
): EdgeGeometry {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length === 0) return loopGeometry(from, from, size);

  const offset = curved ? CURVE_OFFSET : 0;
  const control = {
    x: (from.x + to.x) / 2 - ((to.y - from.y) / length) * offset,
    y: (from.y + to.y) / 2 + ((to.x - from.x) / length) * offset,
  };
  const start = boundaryPoint(from, control, size.rx, size.ry);
  const end = boundaryPoint(to, control, size.rx, size.ry);
  return {
    d: `M ${round(start.x)} ${round(start.y)} Q ${round(control.x)} ${round(control.y)} ${round(end.x)} ${round(end.y)}`,
    label: {
      x: round(bezier(start.x, control.x, end.x, LABEL_T)),
      y: round(bezier(start.y, control.y, end.y, LABEL_T)),
    },
  };
}

import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import toolkit from "./widget-toolkit.json";
import { PURE_LOGIC_SCRIPT, TOOLKIT_CSS, TOOLKIT_SCRIPT } from "./widgetToolkit";

// Motifs du filtre backend `widget_html_problem` (défense en profondeur) + ce que la boîte à outils s'interdit.
const BACKEND: [string, RegExp][] = [
  ["balise interdite", /<\s*\/?\s*(?:html|head|body|meta|base|iframe|object|embed|link|form)\b/i],
  ["script externe", /<\s*script\b[^>]*\bsrc\b/i],
  ["URL absolue", /https?:\/\//i],
  ["URL relative au protocole", /["'(=]\s*\/\/[\w.-]/],
  ["@import", /@import/i],
  ["requête réseau", /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(/i],
  ["accès au parent", /\b(?:window|self|globalThis)\s*\.\s*(?:parent|top)\b|(?<![\w$.-])(?:parent|top)\.[A-Za-z_$]/i],
  ["stockage", /document\s*\.\s*cookie|localStorage|sessionStorage|indexedDB/i],
  ["exécution dynamique", /\beval\s*\(|\bnew\s+Function\b|javascript\s*:/i],
  ["postMessage / srcdoc", /postMessage|srcdoc/i],
];
const FORBIDDEN: [string, RegExp][] = [
  ...BACKEND,
  ["innerHTML", /innerHTML|outerHTML|insertAdjacentHTML|document\.write/i],
  ["fermeture de script", /<\/\s*script/i],
  ["commentaire HTML", /<!--/],
];
// Seul espace de noms XML autorisé (indispensable à createElementNS, sans effet réseau).
const stripNs = (s: string) => s.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, "");
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/* eslint-disable @typescript-eslint/no-explicit-any */
type Fn = (...a: any[]) => any;
const pure = runInNewContext(`${PURE_LOGIC_SCRIPT};P`) as Record<string, Fn>;

describe("script injecté", () => {
  it.each(FORBIDDEN)("aucun motif interdit : %s", (_label, re) => {
    expect(stripNs(TOOLKIT_SCRIPT)).not.toMatch(re);
    expect(TOOLKIT_CSS).not.toMatch(re);
  });

  it("pas de couleur codée en dur dans le CSS", () => {
    expect(TOOLKIT_CSS).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  it("chaque fonction du contrat existe dans le script", () => {
    expect(toolkit.functions.map((f) => f.name).sort()).toEqual(
      ["svg", "axes", "line", "bars", "scatter", "graph", "slider", "stepper", "table", "color"].sort(),
    );
    for (const f of toolkit.functions) {
      expect(TOOLKIT_SCRIPT).toContain(`S.${f.name}=pub("${f.name}"`);
      expect(f.signature.startsWith(`SW.${f.name}(`)).toBe(true);
      expect(f.description.length).toBeGreaterThan(10);
      expect(f.example).toContain("SW");
      expect(Object.keys(f).sort()).toEqual(["description", "example", "name", "signature"]);
    }
  });

  it("le widget d'exemple utilise SW et passe les motifs du filtre", () => {
    expect(toolkit.example_widget).toContain("SW.axes");
    expect(toolkit.example_widget).toContain("SW.slider");
    for (const [, re] of BACKEND) expect(stripNs(toolkit.example_widget)).not.toMatch(re);
  });
});

describe("logique pure", () => {
  it("niceTicks : graduations rondes dans l'intervalle", () => {
    expect(plain(pure.niceTicks(0, 10, 5))).toEqual([0, 2, 4, 6, 8, 10]);
    expect(plain(pure.niceTicks(0, 1, 5))).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(plain(pure.niceTicks(-5, 5, 5))).toEqual([-4, -2, 0, 2, 4]);
    expect(plain(pure.niceTicks(10, 0, 5))).toEqual([0, 2, 4, 6, 8, 10]);
    expect(plain(pure.niceTicks(3, 3, 5)).length).toBeGreaterThan(0);
    expect(plain(pure.niceTicks("abc", NaN, 5)).length).toBeGreaterThan(0);
  });

  it("makeScale : interpolation linéaire, domaine dégénéré au milieu", () => {
    const f = pure.makeScale(0, 10, 100, 200);
    expect([f(0), f(5), f(10)]).toEqual([100, 150, 200]);
    expect(pure.makeScale(0, 10, 200, 100)(0)).toBe(200);
    expect(pure.makeScale(4, 4, 0, 10)()).toBe(5);
  });

  it("extent : ignore les valeurs invalides, inclut zéro à la demande", () => {
    expect(plain(pure.extent([3, 7, NaN, "x", 5], false))).toEqual([3, 7]);
    expect(plain(pure.extent([3, 7], true))).toEqual([0, 7]);
    expect(plain(pure.extent([], false))).toEqual([0, 1]);
    expect(plain(pure.extent([4], false))).toEqual([4, 5]);
  });

  it("normPoints / sample / linePath : lacunes pour les valeurs invalides", () => {
    const pts = plain(pure.normPoints([[1, 2], { x: 3, y: 4 }, [NaN, 1], "z"]));
    expect(pts).toEqual([[1, 2], [3, 4], null, null]);
    expect(() => pure.normPoints("oups")).toThrow();
    expect(plain(pure.sample((x: number) => (x > 0.5 ? NaN : x), 0, 1, 3))).toEqual([[0, 0], [0.5, 0.5], null]);
    const id = (v: number) => v;
    expect(pure.linePath(pts, id, id)).toBe("M1 2L3 4");
    expect(pure.linePath([[0, 0], null, [1, 1], [2, 2]], id, id)).toBe("M0 0M1 1L2 2");
  });

  it("normGraph : normalise noeuds et aretes, refuse les entrées invalides", () => {
    const g = plain(pure.normGraph([{ id: "A", label: "Alpha" }, "B", 3], [["A", "B", 5], { from: "B", to: 3 }]));
    expect(g.ids).toEqual(["A", "B", "3"]);
    expect(g.labels).toEqual(["Alpha", "B", "3"]);
    expect(g.edges).toEqual([{ a: 0, b: 1, label: "5" }, { a: 1, b: 2, label: "" }]);
    expect(() => pure.normGraph([], [])).toThrow();
    expect(() => pure.normGraph(["A", "A"], [])).toThrow(/double/);
    expect(() => pure.normGraph(["A"], [["A", "Z"]])).toThrow(/inconnu/);
    expect(() => pure.normGraph(Array.from({ length: 61 }, (_, i) => i), [])).toThrow();
    expect(() => pure.normGraph(["A"], [["__proto__", "A"]])).toThrow(/inconnu/);
  });

  it("graphLayout : déterministe, dans le cadre, noeuds distincts", () => {
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3]];
    const a: { x: number; y: number }[] = plain(pure.graphLayout(6, pairs, 480, 300, 32));
    expect(a).toEqual(plain(pure.graphLayout(6, pairs, 480, 300, 32)));
    expect(a).toHaveLength(6);
    for (const p of a) {
      expect(p.x).toBeGreaterThanOrEqual(32);
      expect(p.x).toBeLessThanOrEqual(448);
      expect(p.y).toBeGreaterThanOrEqual(32);
      expect(p.y).toBeLessThanOrEqual(268);
    }
    for (let i = 0; i < a.length; i++)
      for (let j = i + 1; j < a.length; j++) expect(Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y)).toBeGreaterThan(20);
    expect(plain(pure.graphLayout(1, [], 480, 300, 32))).toEqual([{ x: 240, y: 150 }]);
    expect(pure.graphLayout(2, [[0, 1]], 480, 300, 32)).toHaveLength(2);
    const lone: { x: number; y: number }[] = plain(pure.graphLayout(5, [[0, 0]], 480, 300, 32));
    expect(lone.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });

  it("edgeEndpoints et pathEdges", () => {
    expect(plain(pure.edgeEndpoints({ x: 0, y: 0 }, { x: 100, y: 0 }, 10))).toEqual({ x1: 10, y1: 0, x2: 90, y2: 0 });
    const edges = [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 }];
    expect(plain(pure.pathEdges([0, 1, 2], edges, true))).toEqual([0, 1]);
    expect(plain(pure.pathEdges([1, 0], edges, true))).toEqual([]);
    expect(plain(pure.pathEdges([1, 0], edges, false))).toEqual([0]);
  });

  it("seriesColorSpec : variables --w-* seulement, cyclique, color-mix", () => {
    expect(pure.seriesColorSpec(0, true)).toBe("var(--w-accent)");
    expect(pure.seriesColorSpec(8, true)).toBe("var(--w-accent)");
    for (const rel of [true, false])
      for (let i = 1; i < 8; i++) {
        const c: string = pure.seriesColorSpec(i, rel);
        expect(c).toContain("color-mix(");
        expect(c).toContain("var(--w-accent)");
        expect(c.replace(/var\(--w-[a-z]+\)/g, "").replace(/in (srgb|oklch)/g, "")).not.toMatch(/#|rgb|hsl/i);
      }
    expect(pure.seriesColorSpec("x", false)).toBe("var(--w-accent)");
  });
});

// --- exécution du script complet avec un faux DOM minimal ---------------------------------------------

class FakeNode {
  nodeType = 1;
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  attrs: Record<string, string> = {};
  style = { setProperty: (k: string, v: string) => void (this.attrs[`style:${k}`] = v) };
  listeners: Record<string, ((e: unknown) => void)[]> = {};
  get className() { return this.attrs.class ?? ""; }
  set className(v: string) { this.attrs.class = v; }
  textContent = "";
  value = "";
  disabled = false;
  constructor(public tag: string) {}
  get firstChild() { return this.children[0] ?? null; }
  setAttribute(k: string, v: string) { this.attrs[k] = v; }
  getAttribute(k: string) { return this.attrs[k] ?? null; }
  appendChild(c: FakeNode) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c: FakeNode) { this.children = this.children.filter((x) => x !== c); return c; }
  addEventListener(t: string, f: (e: unknown) => void) { (this.listeners[t] ??= []).push(f); }
  fire(t: string) { (this.listeners[t] ?? []).forEach((f) => f({ key: "Enter", preventDefault() {} })); }
  find(pred: (n: FakeNode) => boolean): FakeNode[] {
    return [...(pred(this) ? [this] : []), ...this.children.flatMap((c) => c.find(pred))];
  }
}

function load() {
  const body = new FakeNode("body");
  const zone = body.appendChild(new FakeNode("div"));
  zone.setAttribute("id", "zone");
  const document = {
    body,
    documentElement: new FakeNode("html"),
    createElement: (tag: string) => new FakeNode(tag),
    createElementNS: (_ns: string, tag: string) => new FakeNode(tag),
    querySelector: (sel: string) => (sel === "#zone" ? zone : null),
  };
  const win: Record<string, unknown> = {};
  runInNewContext(TOOLKIT_SCRIPT, { window: win, document });
  return { SW: win.SW as Record<string, Fn>, body, zone };
}

const errorsIn = (n: FakeNode) => n.find((x) => x.className === "sw-error");

describe("TOOLKIT_SCRIPT dans un vm (faux document)", () => {
  it("l'init ne lève pas, window.SW expose toutes les fonctions et est gelé", () => {
    const { SW } = load();
    for (const f of toolkit.functions) expect(typeof SW[f.name]).toBe("function");
    expect(Object.isFrozen(SW)).toBe(true);
    expect(Object.keys(SW).sort()).toEqual(toolkit.functions.map((f) => f.name).sort());
  });

  it("courbe + curseur : dessine, met à jour, texte jamais interprété", () => {
    const { SW, zone } = load();
    const chart = SW.axes("#zone", { xmin: -5, xmax: 5, ymin: 0, ymax: 30, xlabel: "x", ylabel: "y", label: "<b>Parabole</b>" });
    const calls: number[] = [];
    const curve = SW.line(chart, (x: number) => x * x, { label: "y = x²" });
    const slider = SW.slider("#zone", {
      label: "a", min: 1, max: 3,
      onChange: (a: number) => { calls.push(a); curve.update((x: number) => a * x * x); },
    });
    expect(calls).toEqual([1]);
    const path = zone.find((n) => n.tag === "path")[0];
    expect(path.attrs.d).toMatch(/^M/);
    const before = path.attrs.d;
    slider.set(3);
    expect(calls).toEqual([1, 3]);
    expect(path.attrs.d).not.toBe(before);
    expect(zone.find((n) => n.tag === "svg")[0].attrs["aria-label"]).toContain("<b>Parabole</b>");
    expect(zone.find((n) => n.tag === "text" && n.textContent === "y = x²")).toHaveLength(1);
    expect(errorsIn(zone)).toHaveLength(0);
    expect(SW.color(1)).toContain("color-mix(");
  });

  it("bars, scatter, graph, stepper et table construisent leur contenu", () => {
    const { SW, zone } = load();
    const b = SW.bars("#zone", { labels: ["A", "B"], values: [3, 7], highlight: 1 });
    expect(zone.find((n) => n.tag === "rect" && n.className.includes("sw-on"))).toHaveLength(1);
    b.update([1, 2]);
    const sc = SW.scatter(SW.axes("#zone", {}), [[1, 2], [3, 4], [NaN, 1]]);
    expect(zone.find((n) => n.className === "sw-dot")).toHaveLength(2);
    sc.update([[5, 5]]);
    const g = SW.graph("#zone", {
      nodes: ["A", "B", "C", "D"], edges: [["A", "B"], ["B", "C"], ["C", "D"]],
      directed: true, highlight: { path: ["A", "B", "C"] },
    });
    expect(zone.find((n) => n.className === "sw-edge sw-on")).toHaveLength(2);
    expect(zone.find((n) => n.className === "sw-node sw-on")).toHaveLength(3);
    g.highlight({ nodes: ["D"] });
    expect(zone.find((n) => n.className === "sw-node sw-on")).toHaveLength(1);
    const steps: number[] = [];
    const st = SW.stepper("#zone", { steps: ["un", { title: "T", text: "deux" }], onStep: (i: number) => steps.push(i) });
    const next = zone.find((n) => n.tag === "button")[1];
    next.fire("click");
    expect(steps).toEqual([0, 1]);
    expect(st.get()).toBe(1);
    expect(next.disabled).toBe(true);
    SW.table("#zone", { headers: ["n"], rows: [[1], [2]], highlight: 1 });
    expect(zone.find((n) => n.tag === "tr" && n.className === "sw-on")).toHaveLength(1);
    expect(errorsIn(zone)).toHaveLength(0);
  });

  it("données invalides : message visible dans le widget, jamais d'exception", () => {
    const { SW, body } = load();
    expect(SW.line(null, [])).toBeNull();
    expect(SW.graph("#zone", { nodes: [] })).toBeNull();
    expect(SW.bars("#zone", {})).toBeNull();
    expect(SW.axes("#introuvable", {})).toBeNull();
    expect(SW.stepper("#zone", { steps: [] })).toBeNull();
    const errors = errorsIn(body);
    expect(errors).toHaveLength(5);
    expect(errors.map((e) => e.textContent.split(" : ")[0]).sort()).toEqual(["SW.axes", "SW.bars", "SW.graph", "SW.line", "SW.stepper"]);
    expect(errors.every((e) => e.attrs.role === "alert")).toBe(true);
    expect(SW.color("n'importe quoi")).toBe("var(--w-accent)");
  });

  it("une erreur du code du modèle dans un callback n'est pas avalée (repli du parent)", () => {
    const { SW } = load();
    expect(() => SW.slider("#zone", { onChange: () => { throw new Error("bug modèle"); } })).toThrow("bug modèle");
  });

  it("document incomplet : aucune exception, message dans le widget", () => {
    const body = new FakeNode("body");
    const win: Record<string, unknown> = {};
    const doc = { body, createElement: (t: string) => new FakeNode(t), querySelector: () => null };
    runInNewContext(TOOLKIT_SCRIPT, { window: win, document: doc });
    const SW = win.SW as Record<string, Fn>;
    expect(() => SW.svg(null, {})).not.toThrow();
    expect(errorsIn(body)).toHaveLength(1);
  });
});

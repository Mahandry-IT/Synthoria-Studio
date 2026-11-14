import { describe, expect, it } from "vitest";
import { TOOLKIT_CSS, TOOLKIT_SCRIPT } from "./widgetToolkit";
import {
  WIDGET_CSP,
  buildWidgetDocument,
  parseWidgetMessage,
} from "./widgetDocument";

describe("buildWidgetDocument", () => {
  const frag = '<div id="w">salut</div><script>var a=1;</script>';
  const doc = buildWidgetDocument({ html: frag, theme: "light" });

  it("place la CSP avant tout autre contenu du head", () => {
    expect(doc.startsWith("<!doctype html>")).toBe(true);
    const csp = doc.indexOf("Content-Security-Policy");
    expect(csp).toBeGreaterThan(-1);
    expect(doc.indexOf("<head>") + "<head>".length).toBeLessThan(csp);
    expect(doc.slice(doc.indexOf("<head>"), csp)).not.toMatch(/<(script|style|meta charset)/);
    expect(csp).toBeLessThan(doc.indexOf("<script>"));
    expect(doc).toContain(WIDGET_CSP);
    expect(WIDGET_CSP).toContain("connect-src 'none'");
    expect(WIDGET_CSP).toContain("default-src 'none'");
  });

  it("injecte les variables de thème clair et sombre", () => {
    expect(doc).toContain("--w-bg:#fdfaf3");
    expect(doc).toContain("color-scheme:light");
    expect(doc).toContain('<html lang="fr" data-theme="light">');
    const dark = buildWidgetDocument({ html: frag, theme: "dark" });
    for (const v of ["--w-bg", "--w-fg", "--w-muted", "--w-accent", "--w-border", "--w-surface"]) {
      expect(dark).toContain(v);
    }
    expect(dark).toContain("--w-bg:#1b2220");
    expect(dark).toContain("color-scheme:dark");
    expect(dark).toContain('<html lang="fr" data-theme="dark">');
    expect(dark).not.toContain("--w-bg:#fdfaf3");
  });

  it("le thème ne change ni la CSP, ni la boîte à outils, ni le script de mesure", () => {
    const dark = buildWidgetDocument({ html: frag, theme: "dark" });
    expect(dark).toContain(`content="${WIDGET_CSP}"`);
    expect(dark).toContain(`<style>${TOOLKIT_CSS}</style>`);
    expect(dark).toContain(`<script>${TOOLKIT_SCRIPT}</script>`);
    expect(dark).not.toContain("allow-same-origin");
    // Hors variables de thème, color-scheme et data-theme, les deux documents sont identiques.
    const strip = (d: string) =>
      d.replace(/:root\{[^}]*\}/, "").replace(/ data-theme="(light|dark)"/, "");
    expect(strip(dark)).toBe(strip(doc));
  });

  it("une valeur de thème inattendue retombe sur le clair", () => {
    const d = buildWidgetDocument({ html: frag, theme: "<script>" as never });
    expect(d).toContain('data-theme="light"');
    expect(d).not.toContain("data-theme=\"<script>\"");
  });

  it("encapsule le fragment tel quel dans le body et inclut le script de mesure", () => {
    expect(doc).toContain(`<body>\n${frag}\n</body>`);
    expect(doc).toContain("ResizeObserver");
    expect(doc).toContain("synthoria-widget");
  });

  it("n'autorise jamais allow-same-origin", () => {
    expect(doc).not.toContain("allow-same-origin");
  });

  it("injecte la boîte à outils SW (style puis script) avant le script de mesure et le body", () => {
    const style = doc.indexOf(`<style>${TOOLKIT_CSS}</style>`);
    const script = doc.indexOf(`<script>${TOOLKIT_SCRIPT}</script>`);
    const measure = doc.indexOf("ResizeObserver");
    expect(style).toBeGreaterThan(doc.indexOf("--w-bg"));
    expect(script).toBeGreaterThan(style);
    expect(script).toBeLessThan(measure);
    expect(script).toBeLessThan(doc.indexOf("<body>"));
    expect(doc.indexOf("Content-Security-Policy")).toBeLessThan(style);
    expect(doc.match(/<\/script>/g)).toHaveLength(3);
    expect(TOOLKIT_SCRIPT).toContain("Object.freeze");
  });

  it("n'élargit pas le protocole vers le parent : un seul postMessage, dans le script de mesure", () => {
    expect(doc.match(/postMessage/g)).toHaveLength(1);
    expect(TOOLKIT_SCRIPT).not.toContain("postMessage");
  });

  it("un ancien widget sans SW reste inchangé dans le body", () => {
    const old = "<canvas id=c></canvas><script>document.getElementById('c');</script>";
    const d = buildWidgetDocument({ html: old, theme: "dark" });
    expect(d.endsWith(`<body>\n${old}\n</body>\n</html>`)).toBe(true);
  });
});

describe("parseWidgetMessage", () => {
  const ok = { source: "synthoria-widget", type: "height", height: 400 };

  it("accepte une hauteur valide et la borne", () => {
    expect(parseWidgetMessage(ok)).toEqual({ type: "height", height: 400 });
    expect(parseWidgetMessage({ ...ok, height: 10 })).toEqual({ type: "height", height: 160 });
    expect(parseWidgetMessage({ ...ok, height: 99999 })).toEqual({ type: "height", height: 1100 });
  });

  it("accepte un message d'erreur", () => {
    expect(parseWidgetMessage({ source: "synthoria-widget", type: "error", message: "x" })).toEqual({ type: "error" });
  });

  it("ignore mauvaise source, mauvais type, NaN et formes invalides", () => {
    expect(parseWidgetMessage({ ...ok, source: "autre" })).toBeNull();
    expect(parseWidgetMessage({ ...ok, type: "eval" })).toBeNull();
    expect(parseWidgetMessage({ ...ok, height: NaN })).toBeNull();
    expect(parseWidgetMessage({ ...ok, height: Infinity })).toBeNull();
    expect(parseWidgetMessage({ ...ok, height: "400" })).toBeNull();
    expect(parseWidgetMessage(null)).toBeNull();
    expect(parseWidgetMessage("height")).toBeNull();
  });
});

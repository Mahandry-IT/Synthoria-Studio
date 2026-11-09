import { describe, expect, it } from "vitest";
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
    expect(doc).toContain("--w-bg:#ffffff");
    const dark = buildWidgetDocument({ html: frag, theme: "dark" });
    for (const v of ["--w-bg", "--w-fg", "--w-muted", "--w-accent", "--w-border", "--w-surface"]) {
      expect(dark).toContain(v);
    }
    expect(dark).toContain("--w-bg:#111827");
    expect(dark).not.toContain("--w-bg:#ffffff");
  });

  it("encapsule le fragment tel quel dans le body et inclut le script de mesure", () => {
    expect(doc).toContain(`<body>\n${frag}\n</body>`);
    expect(doc).toContain("ResizeObserver");
    expect(doc).toContain("synthoria-widget");
  });

  it("n'autorise jamais allow-same-origin", () => {
    expect(doc).not.toContain("allow-same-origin");
  });
});

describe("parseWidgetMessage", () => {
  const ok = { source: "synthoria-widget", type: "height", height: 400 };

  it("accepte une hauteur valide et la borne", () => {
    expect(parseWidgetMessage(ok)).toEqual({ type: "height", height: 400 });
    expect(parseWidgetMessage({ ...ok, height: 10 })).toEqual({ type: "height", height: 160 });
    expect(parseWidgetMessage({ ...ok, height: 99999 })).toEqual({ type: "height", height: 720 });
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

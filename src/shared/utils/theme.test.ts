import { describe, expect, it } from "vitest";
import { parseTheme, resolveTheme, THEME_INIT_SCRIPT } from "./theme";

describe("parseTheme", () => {
  it("accepte light et dark", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });
  it.each([null, undefined, "", "DARK", "blue", 1, {}])("rejette %j", (v) => {
    expect(parseTheme(v)).toBeNull();
  });
});

describe("resolveTheme", () => {
  it("force le clair quand le sombre n'est pas exposé", () => {
    expect(resolveTheme({ stored: "dark", systemPrefersDark: true, darkEnabled: false })).toBe("light");
  });
  it("préfère le choix mémorisé au système", () => {
    expect(resolveTheme({ stored: "light", systemPrefersDark: true, darkEnabled: true })).toBe("light");
    expect(resolveTheme({ stored: "dark", systemPrefersDark: false, darkEnabled: true })).toBe("dark");
  });
  it("suit le système sans choix ou avec une valeur corrompue", () => {
    expect(resolveTheme({ stored: null, systemPrefersDark: true, darkEnabled: true })).toBe("dark");
    expect(resolveTheme({ stored: "n'importe quoi", systemPrefersDark: false, darkEnabled: true })).toBe("light");
  });
});

describe("THEME_INIT_SCRIPT", () => {
  function run(script: string, opts: { stored?: string | null; dark?: boolean; throwing?: boolean }) {
    const attrs: Record<string, string> = {};
    const g = globalThis as Record<string, unknown>;
    g.document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
    g.localStorage = {
      getItem: () => {
        if (opts.throwing) throw new Error("denied");
        return opts.stored ?? null;
      },
    };
    g.window = { matchMedia: () => ({ matches: !!opts.dark }) };
    new Function(script)();
    delete g.document;
    delete g.localStorage;
    delete g.window;
    return attrs["data-theme"];
  }

  it("applique la logique complète : le sombre est actif par défaut", () => {
    expect(run(THEME_INIT_SCRIPT, { stored: "dark" })).toBe("dark");
    expect(run(THEME_INIT_SCRIPT, { stored: "light", dark: true })).toBe("light");
    expect(run(THEME_INIT_SCRIPT, { stored: "zzz", dark: true })).toBe("dark");
    expect(run(THEME_INIT_SCRIPT, { stored: null, dark: true })).toBe("dark");
  });

  it("repli sans localStorage : thème système, sans lever d'erreur", () => {
    expect(run(THEME_INIT_SCRIPT, { throwing: true, dark: true })).toBe("dark");
    expect(run(THEME_INIT_SCRIPT, { throwing: true, dark: false })).toBe("light");
  });

  it("pose light quand le sombre est désactivé (NEXT_PUBLIC_DARK_THEME=false)", () => {
    const disabled = THEME_INIT_SCRIPT.replace("if(true)", "if(false)");
    expect(disabled).not.toBe(THEME_INIT_SCRIPT);
    expect(run(disabled, { stored: "dark", dark: true })).toBe("light");
  });
});

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

  it("pose light tant que le sombre est désactivé", () => {
    expect(run(THEME_INIT_SCRIPT, { stored: "dark", dark: true })).toBe("light");
  });

  it("applique la logique complète quand le sombre est activé", () => {
    const enabled = THEME_INIT_SCRIPT.replace("if(false)", "if(true)");
    expect(enabled).not.toBe(THEME_INIT_SCRIPT);
    expect(run(enabled, { stored: "dark" })).toBe("dark");
    expect(run(enabled, { stored: "zzz", dark: true })).toBe("dark");
    expect(run(enabled, { throwing: true, dark: false })).toBe("light");
  });
});

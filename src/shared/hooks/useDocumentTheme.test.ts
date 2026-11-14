import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscribe, themeFromAttribute } from "./useDocumentTheme";

describe("themeFromAttribute", () => {
  it("lit data-theme, clair pour toute autre valeur", () => {
    expect(themeFromAttribute("dark")).toBe("dark");
    expect(themeFromAttribute("light")).toBe("light");
    expect(themeFromAttribute(null)).toBe("light");
    expect(themeFromAttribute(undefined)).toBe("light");
    expect(themeFromAttribute("Dark")).toBe("light");
    expect(themeFromAttribute("")).toBe("light");
  });
});

describe("subscribe (observateur partagé)", () => {
  const created: { callback: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];

  beforeEach(() => {
    created.length = 0;
    vi.stubGlobal("document", { documentElement: {} });
    vi.stubGlobal(
      "MutationObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(public callback: () => void) {
          created.push(this);
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("un seul observateur sur data-theme, partagé, déclenche tous les écouteurs", () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = subscribe(a);
    const offB = subscribe(b);
    expect(created).toHaveLength(1);
    expect(created[0].observe).toHaveBeenCalledWith(expect.anything(), { attributes: true, attributeFilter: ["data-theme"] });
    created[0].callback();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    expect(created[0].disconnect).not.toHaveBeenCalled();
    offB();
    expect(created[0].disconnect).toHaveBeenCalledTimes(1);
  });
});

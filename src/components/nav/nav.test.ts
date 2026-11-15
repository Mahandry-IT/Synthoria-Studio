import { existsSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PendingPlanItem } from "@/features/course/course.types";
import { NavBar } from "./NavBar";
import { NavRail } from "./NavRail";
import type { NavViewProps } from "./nav.types";
import { findActiveNav } from "./navActive";
import { buildNavCounts, formatNavCount } from "./navCounts";
import { NAV_GROUPS, navHref } from "./navConfig";
import { NAV_DRAWER_STORAGE_KEY, parseDrawerCollapsed, readDrawerCollapsed, storeDrawerCollapsed } from "./navDrawer";

const APP_DIR = join(process.cwd(), "src", "app");
const allItems = NAV_GROUPS.flatMap((g) => g.items);

function plan(id: string, expiresAt: string): PendingPlanItem {
  return { plan_id: id, created_at: "2026-01-01T00:00:00Z", expires_at: expiresAt } as unknown as PendingPlanItem;
}

describe("navConfig", () => {
  it("chaque entrée pointe vers une route existante", () => {
    for (const item of allItems) {
      const page = item.path === "/" ? "page.tsx" : join(item.path.slice(1), "page.tsx");
      expect(existsSync(join(APP_DIR, page)), `${item.path} sans page`).toBe(true);
    }
  });
  it("ids uniques, Podcasts et Dossiers absents", () => {
    const ids = allItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const labels = allItems.map((i) => i.label);
    expect(labels).not.toContain("Podcasts");
    expect(labels).not.toContain("Dossiers");
  });
  it("navHref ajoute l'ancre", () => {
    expect(navHref({ id: "x", label: "x", path: "/upload", hash: "import", icon: "upload" })).toBe("/upload#import");
    expect(navHref(allItems[0])).toBe("/");
  });
});

describe("findActiveNav", () => {
  it("activation par préfixe de chemin", () => {
    expect(findActiveNav(NAV_GROUPS, "/history/abc", "")).toEqual({ groupId: "cours", itemId: "history" });
    expect(findActiveNav(NAV_GROUPS, "/history", "")?.itemId).toBe("history");
    expect(findActiveNav(NAV_GROUPS, "/chat", "")).toEqual({ groupId: "reviser", itemId: "chat" });
  });
  it("`/` active seulement l'accueil", () => {
    expect(findActiveNav(NAV_GROUPS, "/", "")).toEqual({ groupId: "accueil", itemId: "dashboard" });
    expect(findActiveNav(NAV_GROUPS, "/historyx", "")).toBeNull();
    expect(findActiveNav(NAV_GROUPS, "/design", "")).toBeNull();
  });
  it("l'ancre l'emporte sur l'élément sans ancre", () => {
    expect(findActiveNav(NAV_GROUPS, "/", "#plans")?.itemId).toBe("plans");
    expect(findActiveNav(NAV_GROUPS, "/upload", "#import")?.itemId).toBe("import");
    expect(findActiveNav(NAV_GROUPS, "/upload", "")?.itemId).toBe("files");
    expect(findActiveNav(NAV_GROUPS, "/upload", "#autre")?.itemId).toBe("files");
  });
});

describe("compteurs", () => {
  const now = Date.parse("2026-06-01T12:00:00Z");
  it("aucune valeur tant que rien n'a répondu", () => {
    expect(buildNavCounts({ now })).toEqual({});
  });
  it("conserve un vrai zéro et exclut les plans expirés", () => {
    const counts = buildNavCounts({
      filesTotal: 0,
      coursesTotal: 18,
      totalDue: 14,
      plans: [plan("a", "2026-06-01T13:00:00Z"), plan("b", "2026-06-01T11:00:00Z")],
      now,
    });
    expect(counts).toEqual({ files: 0, courses: 18, reviews: 14, plans: 1 });
  });
  it("formate les libellés", () => {
    expect(formatNavCount(undefined)).toBe("");
    expect(formatNavCount(0)).toBe("0");
    expect(formatNavCount(24)).toBe("24");
    expect(formatNavCount(250)).toBe("99+");
  });
});

describe("rendu statique", () => {
  const base: NavViewProps = {
    groups: NAV_GROUPS,
    activeGroupId: "fichiers",
    activeItemId: "files",
    shownGroupId: "fichiers",
    onSelectGroup: () => {},
    counts: { files: 24 },
    onNavigate: () => {},
    theme: null,
  };

  it.each([
    ["rail", NavRail],
    ["barre", NavBar],
  ] as const)("%s : un nav nommé, élément actif, compteur, cibles 44 px", (_name, Component) => {
    const out = renderToStaticMarkup(h(Component, base));
    expect(out.match(/<nav /g)).toHaveLength(1);
    expect(out).toContain('aria-label="Navigation principale"');
    expect(out).toContain('aria-current="page"');
    expect(out).toContain("Tous les fichiers");
    expect(out).toContain("Importer un PDF");
    expect(out).toContain(">24<");
    expect(out).toContain("min-h-11");
    expect(out).not.toContain("Podcasts");
    expect(out).not.toContain("Thème");
  });

  it("le rail masque le tiroir des autres groupes et se replie sous lg", () => {
    const out = renderToStaticMarkup(h(NavRail, base));
    expect(out).toContain("max-lg:hidden");
    expect(out).not.toContain("Historique");
    expect(out).toContain('tabindex="0"');
  });

  it("rail : tabindex 0 sur le groupe de la page, -1 sur les autres", () => {
    const out = renderToStaticMarkup(h(NavRail, { ...base, shownGroupId: "cours" }));
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
    expect(out).toMatch(/aria-current="true"[^>]*>|tabindex="0"[^>]*aria-current="true"/);
  });

  it("la barre se masque à partir de lg", () => {
    expect(renderToStaticMarkup(h(NavBar, base))).toContain("lg:hidden");
  });

  it("bouton de thème seulement si fourni", () => {
    const theme = { dark: false, onToggle: () => {} };
    expect(renderToStaticMarkup(h(NavRail, { ...base, theme }))).toContain("Passer au thème sombre");
    expect(renderToStaticMarkup(h(NavBar, { ...base, theme }))).toContain("Passer au thème sombre");
  });
});

describe("tiroir repliable", () => {
  const base: NavViewProps = {
    groups: NAV_GROUPS,
    activeGroupId: "fichiers",
    activeItemId: "files",
    shownGroupId: "fichiers",
    onSelectGroup: () => {},
    counts: { files: 24 },
    onNavigate: () => {},
    theme: null,
  };
  const toggle = { onToggleDrawer: () => {} };

  it("déplié : bouton « Masquer le menu » dans le tiroir, liens visibles", () => {
    const out = renderToStaticMarkup(h(NavRail, { ...base, ...toggle, drawerCollapsed: false }));
    expect(out).toContain('aria-label="Masquer le menu"');
    expect(out).not.toContain("Afficher le menu");
    expect(out).toContain('aria-expanded="true" aria-controls="nav-drawer" aria-label="Masquer le menu"');
    expect(out).toContain("Importer un PDF");
    expect(out).not.toMatch(/id="nav-drawer"[^>]*class="[^"]*\bhidden\b/);
  });

  it("replié : tiroir hidden, bouton « Afficher le menu » dans le rail", () => {
    const out = renderToStaticMarkup(h(NavRail, { ...base, ...toggle, drawerCollapsed: true }));
    expect(out).toContain('aria-expanded="false" aria-controls="nav-drawer" aria-label="Afficher le menu"');
    expect(out).toMatch(/id="nav-drawer"[^>]*class="[^"]*\bhidden\b|class="[^"]*\bhidden\b[^"]*"[^>]*id="nav-drawer"/);
  });

  it("sans effet sur la barre mobile", () => {
    const out = renderToStaticMarkup(h(NavBar, { ...base, ...toggle, drawerCollapsed: true }));
    expect(out).not.toContain("le menu");
    expect(out).toContain("Importer un PDF");
  });
});

describe("persistance du tiroir", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parseDrawerCollapsed : seulement « 1 » replie", () => {
    expect(parseDrawerCollapsed("1")).toBe(true);
    expect(parseDrawerCollapsed("0")).toBe(false);
    expect(parseDrawerCollapsed("oui")).toBe(false);
    expect(parseDrawerCollapsed(null)).toBe(false);
  });

  it("écrit dans localStorage, mémoire conservée si le stockage lève une erreur", () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { setItem, getItem: () => null } });
    storeDrawerCollapsed(true);
    expect(setItem).toHaveBeenCalledWith(NAV_DRAWER_STORAGE_KEY, "1");
    expect(readDrawerCollapsed()).toBe(true);

    vi.stubGlobal("window", {
      localStorage: {
        setItem: () => {
          throw new Error("quota");
        },
        getItem: () => {
          throw new Error("denied");
        },
      },
    });
    expect(() => storeDrawerCollapsed(false)).not.toThrow();
    expect(readDrawerCollapsed()).toBe(false);
  });
});

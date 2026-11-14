import { describe, expect, it } from "vitest";
import {
  centerScrollTarget,
  chapterNumber,
  chapterView,
  isChapterStarted,
  scrollEdges,
  scrollTargetFor,
  sectionCountLabel,
} from "./readerLayout";

describe("chapterView", () => {
  it("le chapitre courant l'emporte, même terminé", () => {
    expect(chapterView("in_progress", true)).toBe("current");
    expect(chapterView("done", true)).toBe("current");
    expect(chapterView("todo", true)).toBe("current");
  });
  it("hors courant : fait ou à faire, `in_progress` compte comme à faire", () => {
    expect(chapterView("done", false)).toBe("done");
    expect(chapterView("todo", false)).toBe("todo");
    expect(chapterView("in_progress", false)).toBe("todo");
  });
});

describe("isChapterStarted", () => {
  it("repère seulement un chapitre commencé et non courant", () => {
    expect(isChapterStarted("in_progress", false)).toBe(true);
    expect(isChapterStarted("in_progress", true)).toBe(false);
    expect(isChapterStarted("done", false)).toBe(false);
    expect(isChapterStarted("todo", false)).toBe(false);
  });
});

describe("chapterNumber", () => {
  it("numéro sur deux chiffres à partir d'un index 0-based", () => {
    expect(chapterNumber(0)).toBe("01");
    expect(chapterNumber(3)).toBe("04");
    expect(chapterNumber(11)).toBe("12");
    expect(chapterNumber(99)).toBe("100");
  });
  it("index négatif ramené au premier", () => {
    expect(chapterNumber(-2)).toBe("01");
  });
});

describe("sectionCountLabel", () => {
  it("accorde au pluriel", () => {
    expect(sectionCountLabel(12)).toBe("sur 12 sections");
    expect(sectionCountLabel(1)).toBe("sur 1 section");
  });
});

describe("scrollEdges", () => {
  it("début : seule la suite est accessible", () => {
    expect(scrollEdges(0, 1000, 400)).toEqual({ canScrollBack: false, canScrollForward: true });
  });
  it("milieu : les deux sens", () => {
    expect(scrollEdges(300, 1000, 400)).toEqual({ canScrollBack: true, canScrollForward: true });
  });
  it("fin (avec tolérance fractionnaire) : seul le retour est accessible", () => {
    expect(scrollEdges(599.4, 1000, 400)).toEqual({ canScrollBack: true, canScrollForward: false });
  });
  it("contenu qui tient dans la largeur : aucun sens", () => {
    expect(scrollEdges(0, 380, 400)).toEqual({ canScrollBack: false, canScrollForward: false });
  });
});

describe("scrollTargetFor", () => {
  it("avance de 80 % de la largeur visible", () => {
    expect(scrollTargetFor(1, 0, 2000, 500)).toBe(400);
    expect(scrollTargetFor(-1, 800, 2000, 500)).toBe(400);
  });
  it("reste borné au contenu", () => {
    expect(scrollTargetFor(-1, 100, 2000, 500)).toBe(0);
    expect(scrollTargetFor(1, 1400, 2000, 500)).toBe(1500);
  });
});

describe("centerScrollTarget", () => {
  it("centre l'élément dans la zone visible", () => {
    expect(centerScrollTarget(800, 200, 2000, 600)).toBe(600);
  });
  it("borné aux extrémités", () => {
    expect(centerScrollTarget(10, 200, 2000, 600)).toBe(0);
    expect(centerScrollTarget(1900, 200, 2000, 600)).toBe(1400);
  });
});

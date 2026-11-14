import { describe, expect, it } from "vitest";
import type { CourseHistoryItem } from "./history.types";
import { formatHistoryDateTime, historyModeLabel, sortHistoryByDate } from "./history.utils";

const item = (id: string, created_at: string): CourseHistoryItem =>
  ({ id, created_at, question: "Q", filenames: [], mode: "question_only", folder: "Général", subfolder: "Non classé" }) as CourseHistoryItem;

describe("sortHistoryByDate", () => {
  it("du plus récent au plus ancien, sans modifier la liste d'origine", () => {
    const items = [item("a", "2026-09-18T10:00:00Z"), item("c", "2026-09-20T10:00:00Z"), item("b", "2026-09-19T10:00:00Z")];
    expect(sortHistoryByDate(items).map((i) => i.id)).toEqual(["c", "b", "a"]);
    expect(items.map((i) => i.id)).toEqual(["a", "c", "b"]);
  });
});

describe("historyModeLabel", () => {
  it("distingue documents et recherche web", () => {
    expect(historyModeLabel("file_question")).toBe("Sur documents");
    expect(historyModeLabel("question_only")).toBe("Recherche web");
  });
});

describe("formatHistoryDateTime", () => {
  it("date puis heure", () => {
    expect(formatHistoryDateTime(new Date(2026, 10, 14, 9, 5).toISOString())).toBe("14/11/2026 · 09:05");
  });
});

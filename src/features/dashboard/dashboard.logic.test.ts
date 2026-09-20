import { describe, expect, it } from "vitest";
import type { PendingPlanItem } from "@/features/course/course.types";
import {
  activePlans,
  formatCountdown,
  formatRelativeDate,
  isExpiringSoon,
  pickRecent,
} from "./dashboard.logic";

const NOW = new Date("2026-09-20T12:00:00Z").getTime();
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;

const plan = (id: string, createdOffset: number, expiresOffset: number): PendingPlanItem => ({
  plan_id: id,
  question: "Q",
  title: id,
  subject: "S",
  sections_count: 5,
  created_at: at(createdOffset),
  expires_at: at(expiresOffset),
});

describe("pickRecent", () => {
  const items = [
    { id: "b", created_at: at(-2 * HOUR) },
    { id: "d", created_at: at(-10 * HOUR) },
    { id: "a", created_at: at(-1 * HOUR) },
    { id: "c", created_at: at(-5 * HOUR) },
  ];

  it("garde les 3 plus récents, du plus récent au plus ancien", () => {
    expect(pickRecent(items).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("respecte un autre nombre et ne modifie pas l'entrée", () => {
    const copy = [...items];

    expect(pickRecent(items, 1).map((i) => i.id)).toEqual(["a"]);
    expect(items).toEqual(copy);
  });

  it("gère moins d'éléments que demandé, une liste vide et un nombre négatif", () => {
    expect(pickRecent(items.slice(0, 2))).toHaveLength(2);
    expect(pickRecent([])).toEqual([]);
    expect(pickRecent(items, -1)).toEqual([]);
  });
});

describe("activePlans", () => {
  it("filtre les plans expirés et trie du plus récent au plus ancien", () => {
    const plans = [
      plan("vieux", -3 * HOUR, 30 * MIN),
      plan("expire", -2 * HOUR, -1 * MIN),
      plan("recent", -10 * MIN, 110 * MIN),
      plan("pile", -1 * HOUR, 0),
    ];

    expect(activePlans(plans, NOW).map((p) => p.plan_id)).toEqual(["recent", "vieux"]);
  });
});

describe("formatCountdown", () => {
  it.each([
    [-1, "Expiré"],
    [0, "Expiré"],
    [30_000, "moins d'1 min"],
    [12 * MIN + 20_000, "12 min"],
    [HOUR + 5 * MIN, "1 h 05"],
    [110 * MIN, "1 h 50"],
    [26 * HOUR, "1 j 2 h"],
  ])("dans %s ms → %s", (offset, expected) => {
    expect(formatCountdown(at(offset), NOW)).toBe(expected);
  });

  it("date invalide → Expiré", () => {
    expect(formatCountdown("pas une date", NOW)).toBe("Expiré");
  });
});

describe("isExpiringSoon", () => {
  it("vrai sous 15 min, faux au-delà et une fois expiré", () => {
    expect(isExpiringSoon(at(14 * MIN), NOW)).toBe(true);
    expect(isExpiringSoon(at(15 * MIN), NOW)).toBe(false);
    expect(isExpiringSoon(at(-1), NOW)).toBe(false);
  });
});

describe("formatRelativeDate", () => {
  it.each([
    [-10_000, "à l'instant"],
    [-5 * MIN, "il y a 5 min"],
    [-3 * HOUR, "il y a 3 h"],
    [-30 * HOUR, "hier"],
  ])("%s ms → %s", (offset, expected) => {
    expect(formatRelativeDate(at(offset), NOW)).toBe(expected);
  });

  it("au-delà de 2 jours : date JJ/MM/AAAA", () => {
    expect(formatRelativeDate(at(-5 * 24 * HOUR), NOW)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

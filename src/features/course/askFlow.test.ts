import { describe, expect, it } from "vitest";
import { resolveAskPhase, toPendingPlan, type PendingPlan } from "./askFlow";

const pendingPlan = { request: { question: "Q" }, plan: { plan_id: "p" } } as PendingPlan;
const lastCourseId = "c-1";

describe("resolveAskPhase", () => {
  it("question par défaut", () => {
    expect(resolveAskPhase(null, null)).toBe("question");
  });

  it("plan_review quand un plan est en attente", () => {
    expect(resolveAskPhase(pendingPlan, null)).toBe("plan_review");
  });

  it("course quand un cours est disponible", () => {
    expect(resolveAskPhase(null, lastCourseId)).toBe("course");
  });

  it("le plan en attente prime sur un ancien cours", () => {
    expect(resolveAskPhase(pendingPlan, lastCourseId)).toBe("plan_review");
  });
});

describe("toPendingPlan", () => {
  const detail = {
    plan_id: "p-1",
    expires_at: "2026-09-20T12:00:00Z",
    mode: "file_question" as const,
    meta: { title: "T", subject: "S", language: "fr" },
    sections: [],
    coverage_notes: "",
    question: "Explique X",
    filenames: [] as string[],
  };

  it("sépare la requête d'origine du plan", () => {
    const pending = toPendingPlan(detail);

    expect(pending.request).toEqual({ question: "Explique X", depth: "approfondi" });
    expect(pending.plan.plan_id).toBe("p-1");
    expect(pending.plan).not.toHaveProperty("question");
    expect(pending.plan).not.toHaveProperty("filenames");
  });

  it("reprend le niveau de détail du plan dans la requête (régénération du plan)", () => {
    const pending = toPendingPlan({ ...detail, depth: "express" });

    expect(pending.request.depth).toBe("express");
    expect(pending.plan.depth).toBe("express");
  });

  it("un ancien plan sans niveau de détail est repris en approfondi", () => {
    expect(toPendingPlan(detail).plan.depth).toBe("approfondi");
  });

  it("un seul fichier → chaîne, plusieurs → tableau", () => {
    expect(toPendingPlan({ ...detail, filenames: ["a.pdf"] }).request.filename).toBe("a.pdf");
    expect(toPendingPlan({ ...detail, filenames: ["a.pdf", "b.pdf"] }).request.filename).toEqual(["a.pdf", "b.pdf"]);
  });
});

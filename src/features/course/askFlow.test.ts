import { describe, expect, it } from "vitest";
import { resolveAskPhase, toPendingPlan, type PendingPlan } from "./askFlow";
import type { CourseGenerationResponse } from "./course.types";

const pendingPlan = { request: { question: "Q" }, plan: { plan_id: "p" } } as PendingPlan;
const course = { mode: "question_only", format: "focused_answer" } as CourseGenerationResponse;

describe("resolveAskPhase", () => {
  it("question par défaut", () => {
    expect(resolveAskPhase(null, null)).toBe("question");
  });

  it("plan_review quand un plan est en attente", () => {
    expect(resolveAskPhase(pendingPlan, null)).toBe("plan_review");
  });

  it("course quand un cours est disponible", () => {
    expect(resolveAskPhase(null, course)).toBe("course");
  });

  it("le plan en attente prime sur un ancien cours", () => {
    expect(resolveAskPhase(pendingPlan, course)).toBe("plan_review");
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

    expect(pending.request).toEqual({ question: "Explique X" });
    expect(pending.plan.plan_id).toBe("p-1");
    expect(pending.plan).not.toHaveProperty("question");
    expect(pending.plan).not.toHaveProperty("filenames");
  });

  it("un seul fichier → chaîne, plusieurs → tableau", () => {
    expect(toPendingPlan({ ...detail, filenames: ["a.pdf"] }).request.filename).toBe("a.pdf");
    expect(toPendingPlan({ ...detail, filenames: ["a.pdf", "b.pdf"] }).request.filename).toEqual(["a.pdf", "b.pdf"]);
  });
});

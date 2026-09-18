import { describe, expect, it } from "vitest";
import { resolveAskPhase, type PendingPlan } from "./askFlow";
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

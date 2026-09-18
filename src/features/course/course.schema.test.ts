import { describe, expect, it } from "vitest";
import { COURSE_PLAN_MAX_SECTIONS } from "@/shared/utils/constants";
import { courseFromPlanRequestSchema, coursePlanSchema } from "./course.schema";

const section = (order: number, type = "development") => ({
  type,
  title: `Section ${order}`,
  objective: "obj",
  subtopics: ["a"],
  order,
});

const build = (n: number) => Array.from({ length: n }, (_, i) => section(i + 1));

describe("courseFromPlanRequestSchema", () => {
  it("accepte un plan valide", () => {
    expect(courseFromPlanRequestSchema.safeParse({ plan_id: "p", sections: [section(1)] }).success).toBe(true);
  });

  it("refuse un plan sans section de développement", () => {
    const result = courseFromPlanRequestSchema.safeParse({ plan_id: "p", sections: [section(1, "introduction")] });
    expect(result.success).toBe(false);
  });

  it("accepte exactement le plafond de sections et refuse au-delà", () => {
    expect(courseFromPlanRequestSchema.safeParse({ plan_id: "p", sections: build(COURSE_PLAN_MAX_SECTIONS) }).success).toBe(true);
    expect(courseFromPlanRequestSchema.safeParse({ plan_id: "p", sections: build(COURSE_PLAN_MAX_SECTIONS + 1) }).success).toBe(false);
  });

  it("refuse un titre vide et un order < 1", () => {
    expect(courseFromPlanRequestSchema.safeParse({ plan_id: "p", sections: [{ ...section(1), title: "  " }] }).success).toBe(false);
    expect(courseFromPlanRequestSchema.safeParse({ plan_id: "p", sections: [section(0)] }).success).toBe(false);
  });
});

describe("coursePlanSchema", () => {
  it("parse une réponse /courses/plan", () => {
    const result = coursePlanSchema.safeParse({
      plan_id: "3f2b8a52-0d7c-4f6e-9c1a-6d5e4b3a2f10",
      expires_at: "2026-09-18T12:00:00+00:00",
      mode: "question_only",
      meta: { title: "T", subject: "S", language: "fr" },
      sections: [section(1)],
      coverage_notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("refuse un plan sans section", () => {
    const result = coursePlanSchema.safeParse({
      plan_id: "p", expires_at: "x", mode: "file_question", meta: {}, sections: [], coverage_notes: "",
    });
    expect(result.success).toBe(false);
  });
});

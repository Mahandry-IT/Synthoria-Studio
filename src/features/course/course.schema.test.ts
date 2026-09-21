import { describe, expect, it } from "vitest";
import { COURSE_PLAN_MAX_SECTIONS } from "@/shared/utils/constants";
import { courseFromPlanRequestSchema, coursePlanSchema, courseResponseSchema } from "./course.schema";

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

describe("courseResponseSchema — session_id et podcast_job_id", () => {
  const base = { mode: "question_only", format: "focused_answer", meta: {}, sources: [] };

  it("accepte un cours sans les nouveaux champs (sessionStorage / historique existants)", () => {
    const result = courseResponseSchema.safeParse(base);

    expect(result.success).toBe(true);
    expect(result.data?.session_id).toBeUndefined();
    expect(result.data?.podcast_job_id).toBeUndefined();
  });

  it("conserve session_id et podcast_job_id quand le backend les fournit", () => {
    const result = courseResponseSchema.safeParse({ ...base, session_id: "s-1", podcast_job_id: "j-1" });

    expect(result.data).toMatchObject({ session_id: "s-1", podcast_job_id: "j-1" });
  });

  it("accepte null (persistance échouée / podcast non lancé)", () => {
    const result = courseResponseSchema.safeParse({ ...base, session_id: null, podcast_job_id: null });

    expect(result.success).toBe(true);
    expect(result.data?.session_id).toBeNull();
  });
});

describe("courseResponseSchema — tableaux et vidéos", () => {
  const base = {
    mode: "question_only",
    format: "focused_answer",
    meta: { title: "T" },
    sources: [],
  };

  it("accepte les anciens cours sans tables ni videos", () => {
    const parsed = courseResponseSchema.parse({ ...base, sections: [{ title: "A" }] });
    expect(parsed.sections?.[0].tables).toEqual([]);
    expect(parsed.videos).toBeUndefined();
  });

  it("conserve les tableaux structurés et les vidéos", () => {
    const parsed = courseResponseSchema.parse({
      ...base,
      sections: [{ title: "A", tables: [{ caption: "C", headers: ["a"], rows: [["1"]] }] }],
      videos: [
        { video_id: "dQw4w9WgXcQ", url: "u", embed_url: "e", thumbnail_url: "t", title: "V", channel: "Ch" },
      ],
    });
    expect(parsed.sections?.[0].tables?.[0].rows).toEqual([["1"]]);
    expect(parsed.videos?.[0].video_id).toBe("dQw4w9WgXcQ");
  });
});

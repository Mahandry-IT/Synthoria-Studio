import { describe, expect, it } from "vitest";
import { COURSE_PLAN_MAX_SECTIONS } from "@/shared/utils/constants";
import {
  courseFromPlanRequestSchema,
  coursePlanSchema,
  courseResponseSchema,
  moreSectionsResponseSchema,
  recallRequestSchema,
  recallResponseSchema,
  regenerateSectionResponseSchema,
  sectionNoteRequestSchema,
  sectionNoteResponseSchema,
} from "./course.schema";

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

  it("accepte les vidéos avec ou sans durée/date/classement (V1 sans clé Data API, V2 désactivé)", () => {
    const withoutExtras = courseResponseSchema.parse({
      ...base,
      videos: [{ video_id: "dQw4w9WgXcQ", url: "u", embed_url: "e", thumbnail_url: "t", title: "V" }],
    });
    expect(withoutExtras.videos?.[0].duration_seconds).toBeUndefined();

    const withExtras = courseResponseSchema.parse({
      ...base,
      videos: [{
        video_id: "dQw4w9WgXcQ", url: "u", embed_url: "e", thumbnail_url: "t", title: "V",
        duration_seconds: 754, published_at: "2024-01-01T00:00:00Z",
        category: "cours", level: "debutant", relevance_reason: "Explique clairement le sujet.",
      }],
    });
    expect(withExtras.videos?.[0]).toMatchObject({ duration_seconds: 754, category: "cours" });
  });
});

describe("courseAnswerSchema (via courseResponseSchema)", () => {
  const base = {
    mode: "question_only",
    format: "focused_answer",
    meta: { title: "T", subject: "S", language: "fr", generated_at: "2026-01-01T00:00:00Z" },
    sources: [],
    summary: "",
  };

  it("parse le nouveau format : résumé, points clés et bloc tableau", () => {
    const parsed = courseResponseSchema.parse({
      ...base,
      answer: {
        summary: "Réponse courte.",
        key_points: ["a"],
        blocks: [{ type: "table", table: { caption: "c", headers: ["h"], rows: [["x"]] }, ignored: 1 }],
      },
    });
    expect(parsed.answer?.summary).toBe("Réponse courte.");
    expect(parsed.answer?.blocks[0].table?.headers).toEqual(["h"]);
  });

  it("accepte l'ancien format (quoi/pourquoi/comment)", () => {
    const parsed = courseResponseSchema.parse({ ...base, answer: { quoi: "q", pourquoi: "p", comment: "c" } });
    expect(parsed.answer?.quoi).toBe("q");
    expect(parsed.answer?.summary).toBe("");
    expect(parsed.answer?.blocks).toEqual([]);
  });
});

describe("cycle pédagogique (courseResponseSchema, coursePlanSchema)", () => {
  const base = {
    mode: "question_only",
    format: "full_course",
    meta: { title: "T", subject: "S", language: "fr", generated_at: "2026-01-01T00:00:00Z" },
    sources: [],
    introduction: { quoi: "x" },
    summary: "",
  };
  const question = { question: "Q", options: ["A", "B"], correct_option_indices: [1], explanation_per_choice: ["non", "oui"] };

  it("parse défi, exemple à trous, vérification et reformulation", () => {
    const parsed = courseResponseSchema.parse({
      ...base,
      sections: [
        {
          id: "1",
          title: "S",
          quoi: "q",
          pourquoi: "p",
          comment: "c",
          challenge: "Que se passe-t-il ?",
          faded_example: { statement: "s", given_steps: ["1"], hidden_steps: ["2"], result: "r" },
          check_questions: [question],
          recall_prompt: { prompt: "Explique.", expected_key_points: ["a"] },
        },
      ],
    });
    const section = parsed.sections?.[0];
    expect(section?.challenge).toBe("Que se passe-t-il ?");
    expect(section?.faded_example?.hidden_steps).toEqual(["2"]);
    expect(section?.check_questions[0].explanation_per_choice).toEqual(["non", "oui"]);
    expect(section?.recall_prompt?.prompt).toBe("Explique.");
  });

  it("une section historique reste valide, sans cycle", () => {
    const parsed = courseResponseSchema.parse({ ...base, sections: [{ id: "1", title: "S", quoi: "q" }] });
    const section = parsed.sections?.[0];
    expect(section?.challenge).toBe("");
    expect(section?.check_questions).toEqual([]);
    expect(section?.faded_example).toBeUndefined();
  });

  it("parse pré-test et mastery du plan, et un plan sans pré-test", () => {
    const section = { type: "development", title: "Principe", objective: "", subtopics: [], order: 2 };
    const plan = { plan_id: "p", expires_at: "x", mode: "question_only", meta: {}, sections: [{ ...section, mastery: "known" }] };

    const withPretest = coursePlanSchema.parse({ ...plan, pretest: [{ section_title: "Principe", question }] });
    expect(withPretest.pretest[0].question.correct_option_indices).toEqual([1]);
    expect(withPretest.sections[0].mastery).toBe("known");
    expect(coursePlanSchema.parse(plan).pretest).toEqual([]);
  });
});

describe("recallResponseSchema", () => {
  it("valide le verdict et refuse une valeur inconnue", () => {
    expect(recallResponseSchema.parse({ verdict: "partiel", feedback: "ok" }).missing_points).toEqual([]);
    expect(recallResponseSchema.safeParse({ verdict: "peut-être", feedback: "x" }).success).toBe(false);
  });

  it("recallRequestSchema borne la réponse", () => {
    expect(recallRequestSchema.safeParse({ answer: "  " }).success).toBe(false);
    expect(recallRequestSchema.safeParse({ answer: "x".repeat(1001) }).success).toBe(false);
    expect(recallRequestSchema.parse({ answer: " ok " }).answer).toBe("ok");
  });
});

describe("régénération et notes de section", () => {
  const worked_example = { statement: "", steps: [], result: "" };

  it("regenerateSectionResponseSchema parse une CourseSection régénérée", () => {
    const parsed = regenerateSectionResponseSchema.parse({
      id: "0", title: "T", quoi: "q", pourquoi: "p", comment: "c", worked_example, incomplete: false,
    });
    expect(parsed.incomplete).toBe(false);
    expect(parsed.note).toBe("");
  });

  it("courseSectionSchema (via courseResponseSchema) donne des défauts sûrs à incomplete et note", () => {
    const parsed = courseResponseSchema.parse({
      mode: "question_only", format: "full_course", introduction: { quoi: "x" },
      meta: { title: "T", subject: "S", language: "fr", generated_at: "2026-01-01T00:00:00Z" },
      sources: [], summary: "",
      sections: [{ id: "0", title: "T", quoi: "q", pourquoi: "p", comment: "c", worked_example }],
    });
    expect(parsed.sections?.[0].incomplete).toBe(false);
    expect(parsed.sections?.[0].note).toBe("");
  });

  it("courseSectionSchema accepte incomplete=true et une note existante", () => {
    const parsed = courseResponseSchema.parse({
      mode: "question_only", format: "full_course", introduction: { quoi: "x" },
      meta: { title: "T", subject: "S", language: "fr", generated_at: "2026-01-01T00:00:00Z" },
      sources: [], summary: "",
      sections: [{
        id: "0", title: "T", quoi: "", pourquoi: "", comment: "", worked_example,
        incomplete: true, note: "Revoir cette partie.",
      }],
    });
    expect(parsed.sections?.[0].incomplete).toBe(true);
    expect(parsed.sections?.[0].note).toBe("Revoir cette partie.");
  });

  it("sectionNoteRequestSchema borne la note et accepte une chaîne vide (efface la note)", () => {
    expect(sectionNoteRequestSchema.safeParse({ note: "x".repeat(2001) }).success).toBe(false);
    expect(sectionNoteRequestSchema.parse({ note: "" }).note).toBe("");
    expect(sectionNoteRequestSchema.parse({ note: "  Revoir  " }).note).toBe("Revoir");
  });

  it("sectionNoteResponseSchema parse note et updated_at", () => {
    const parsed = sectionNoteResponseSchema.parse({ note: "x", updated_at: "2026-01-01T00:00:00Z" });
    expect(parsed).toEqual({ note: "x", updated_at: "2026-01-01T00:00:00Z" });
  });
});

describe("moreSectionsResponseSchema", () => {
  const section = (type: string, title: string, order: number) => ({ type, title, objective: "", subtopics: ["a"], order });

  it("conserve next_steps après parsing", () => {
    const parsed = moreSectionsResponseSchema.parse({
      sections: [section("development", "N1", 3)],
      next_steps: section("next_steps", "Suite", 2),
    });
    expect(parsed.next_steps?.title).toBe("Suite");
  });

  it("accepte l'absence ou la nullité de next_steps", () => {
    expect(moreSectionsResponseSchema.parse({ sections: [section("development", "N1", 3)] }).next_steps).toBeUndefined();
    expect(
      moreSectionsResponseSchema.parse({ sections: [section("development", "N1", 3)], next_steps: null }).next_steps,
    ).toBeNull();
  });
});

describe("courseResponseSchema — sous-sections par blocs", () => {
  const base = {
    mode: "question_only",
    format: "full_course",
    meta: { title: "T", subject: "S", language: "fr", generated_at: "2026-01-01T00:00:00Z" },
    sources: [],
    introduction: { quoi: "x" },
    summary: "",
  };
  const legacySection = { id: "0", title: "S", quoi: "q", pourquoi: "p", comment: "c" };

  it("parse les sous-sections et garde une section legacy valide", () => {
    const parsed = courseResponseSchema.parse({
      ...base,
      sections: [
        {
          ...legacySection,
          subsections: [{ title: "Quoi", blocks: [{ type: "diagram", diagram: { kind: "flowchart", mermaid: "A-->B" } }] }],
        },
        legacySection,
      ],
    });
    expect(parsed.sections?.[0].subsections?.[0].blocks[0].diagram?.mermaid).toBe("A-->B");
    expect(parsed.sections?.[1].subsections).toEqual([]);
  });

  it("ignore un visuel invalide et accepte un type de bloc inconnu", () => {
    const parsed = courseResponseSchema.parse({
      ...base,
      sections: [
        {
          ...legacySection,
          subsections: [
            {
              title: "Quoi",
              blocks: [
                { type: "diagram", diagram: { kind: "inconnu", mermaid: "A-->B" } },
                { type: "hologram" },
              ],
            },
          ],
        },
      ],
    });
    const blocks = parsed.sections?.[0].subsections?.[0].blocks ?? [];
    expect(blocks[0].diagram).toBeNull();
    expect(blocks[1].type).toBe("hologram");
  });
});

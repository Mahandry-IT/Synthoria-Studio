import { describe, expect, it } from "vitest";
import {
  podcastEnqueueResponseSchema,
  podcastGenerationOptionsSchema,
  podcastJobListSchema,
  podcastJobSchema,
  podcastSummaryListSchema,
} from "./podcast.schema";

const JOB_ID = "3f2b8a52-0d7c-4f6e-9c1a-6d5e4b3a2f10";
const SESSION_ID = "9a1c2b3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d";

const validJob = {
  job_id: JOB_ID,
  course_session_id: SESSION_ID,
  status: "synthesizing",
  stage: "synthesizing",
  progress: 55,
  error_message: null,
  duration_seconds: null,
  created_at: "2026-09-20T10:00:00Z",
  updated_at: "2026-09-20T10:01:00Z",
};

describe("podcastJobSchema", () => {
  it("accepte un job valide", () => {
    expect(podcastJobSchema.safeParse(validJob).success).toBe(true);
  });

  it("normalise les champs optionnels absents en null / 0", () => {
    const minimal = {
      job_id: JOB_ID,
      course_session_id: SESSION_ID,
      status: "pending",
      created_at: validJob.created_at,
      updated_at: validJob.updated_at,
    };
    const result = podcastJobSchema.parse(minimal);

    expect(result).toMatchObject({ stage: null, error_message: null, duration_seconds: null, progress: 0 });
  });

  it.each([
    ["job_id non UUID", { job_id: "../../etc/passwd" }],
    ["statut inconnu", { status: "exploded" }],
    ["progression > 100", { progress: 101 }],
    ["progression négative", { progress: -1 }],
  ])("refuse : %s", (_name, patch) => {
    expect(podcastJobSchema.safeParse({ ...validJob, ...patch }).success).toBe(false);
  });
});

describe("listes", () => {
  it("podcastSummaryListSchema exige le titre ou le complète", () => {
    const withTitle = podcastSummaryListSchema.parse({ data: [{ ...validJob, title: "Le podcast" }] });
    const withoutTitle = podcastSummaryListSchema.parse({ data: [validJob] });

    expect(withTitle.data[0].title).toBe("Le podcast");
    expect(withoutTitle.data[0].title).toBe("");
  });

  it("accepte des listes vides", () => {
    expect(podcastSummaryListSchema.parse({ data: [] }).data).toEqual([]);
    expect(podcastJobListSchema.parse({ data: [] }).data).toEqual([]);
  });

  it("refuse un élément invalide", () => {
    expect(podcastJobListSchema.safeParse({ data: [{ ...validJob, job_id: "x" }] }).success).toBe(false);
  });
});

describe("podcastEnqueueResponseSchema", () => {
  it("accepte {job_id, status}", () => {
    expect(podcastEnqueueResponseSchema.safeParse({ job_id: JOB_ID, status: "pending" }).success).toBe(true);
  });

  it("refuse un job_id invalide", () => {
    expect(podcastEnqueueResponseSchema.safeParse({ job_id: "abc", status: "pending" }).success).toBe(false);
  });
});

describe("podcastGenerationOptionsSchema", () => {
  it("accepte les options du backend", () => {
    expect(podcastGenerationOptionsSchema.safeParse({ style: "concise", target_minutes: 10, force: true }).success).toBe(true);
    expect(podcastGenerationOptionsSchema.safeParse({}).success).toBe(true);
  });

  it.each([{ target_minutes: 2 }, { target_minutes: 61 }, { style: "rap" }, { inconnue: 1 }])(
    "refuse %o",
    (options) => {
      expect(podcastGenerationOptionsSchema.safeParse(options).success).toBe(false);
    },
  );
});

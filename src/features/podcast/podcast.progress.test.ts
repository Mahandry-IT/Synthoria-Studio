import { describe, expect, it } from "vitest";
import {
  POLL_INTERVAL_MS,
  displayProgress,
  isTerminal,
  monotonicJob,
  pollIntervalMs,
  stageIndex,
  stageLabel,
} from "./podcast.progress";
import type { PodcastJob } from "./podcast.types";

const JOB_ID = "3f2b8a52-0d7c-4f6e-9c1a-6d5e4b3a2f10";

const job = (overrides: Partial<PodcastJob> = {}): PodcastJob => ({
  job_id: JOB_ID,
  course_session_id: "9a1c2b3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d",
  status: "scripting",
  stage: "scripting",
  progress: 10,
  error_message: null,
  duration_seconds: null,
  created_at: "2026-09-20T10:00:00Z",
  updated_at: "2026-09-20T10:00:00Z",
  ...overrides,
});

describe("stageLabel", () => {
  it.each([
    ["scripting", "Écriture du script"],
    ["synthesizing", "Synthèse des voix"],
    ["mixing", "Montage audio"],
  ])("étape %s → %s", (stage, label) => {
    expect(stageLabel(job({ stage }))).toBe(label);
  });

  it("retombe sur le statut quand l'étape est absente", () => {
    expect(stageLabel(job({ stage: null, status: "mixing" }))).toBe("Montage audio");
  });

  it("gère les états sans étape", () => {
    expect(stageLabel(job({ stage: null, status: "pending" }))).toBe("En attente de démarrage");
    expect(stageLabel(job({ status: "done" }))).toBe("Podcast prêt");
    expect(stageLabel(job({ status: "failed" }))).toBe("La génération a échoué");
    expect(stageLabel(undefined)).toBe("Préparation du podcast");
  });

  it("ignore une étape inconnue du backend", () => {
    expect(stageLabel(job({ stage: "inconnue", status: "pending" }))).toBe("En attente de démarrage");
  });
});

describe("stageIndex", () => {
  it("suit l'ordre du pipeline", () => {
    expect(stageIndex(job({ stage: "scripting" }))).toBe(0);
    expect(stageIndex(job({ stage: "synthesizing", status: "synthesizing" }))).toBe(1);
    expect(stageIndex(job({ stage: "mixing", status: "mixing" }))).toBe(2);
    expect(stageIndex(job({ stage: null, status: "pending" }))).toBe(-1);
    expect(stageIndex(job({ status: "done" }))).toBe(3);
    expect(stageIndex(null)).toBe(-1);
  });
});

describe("isTerminal", () => {
  it("done et failed seulement", () => {
    expect(isTerminal("done")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("pending")).toBe(false);
    expect(isTerminal("mixing")).toBe(false);
    expect(isTerminal(undefined)).toBe(false);
  });
});

describe("displayProgress", () => {
  it("borne 0-100 et arrondit", () => {
    expect(displayProgress(job({ progress: 42.6 }))).toBe(43);
    expect(displayProgress(job({ progress: -5 }))).toBe(0);
    expect(displayProgress(job({ progress: 250 }))).toBe(100);
    expect(displayProgress(job({ progress: Number.NaN }))).toBe(0);
    expect(displayProgress(null)).toBe(0);
  });

  it("vaut 100 sur un job terminé avec succès, même si le backend renvoie moins", () => {
    expect(displayProgress(job({ status: "done", progress: 90 }))).toBe(100);
  });

  it("conserve la progression d'un job en échec", () => {
    expect(displayProgress(job({ status: "failed", progress: 35 }))).toBe(35);
  });
});

describe("monotonicJob", () => {
  it("ne recule jamais pendant l'exécution", () => {
    const previous = job({ progress: 60 });

    expect(monotonicJob(previous, job({ progress: 40 })).progress).toBe(60);
    expect(monotonicJob(previous, job({ progress: 75 })).progress).toBe(75);
  });

  it("accepte le premier relevé et un autre job", () => {
    expect(monotonicJob(undefined, job({ progress: 5 })).progress).toBe(5);
    expect(monotonicJob(job({ progress: 80 }), job({ job_id: "autre", progress: 5 })).progress).toBe(5);
  });

  it("ne masque pas un état terminal", () => {
    expect(monotonicJob(job({ progress: 80 }), job({ status: "failed", progress: 30 })).progress).toBe(30);
  });
});

describe("pollIntervalMs", () => {
  it("2 s tant que le job est actif ou inconnu, arrêt net à l'état terminal", () => {
    expect(pollIntervalMs(undefined)).toBe(POLL_INTERVAL_MS);
    expect(pollIntervalMs(job({ status: "pending" }))).toBe(2_000);
    expect(pollIntervalMs(job({ status: "synthesizing" }))).toBe(2_000);
    expect(pollIntervalMs(job({ status: "done" }))).toBe(false);
    expect(pollIntervalMs(job({ status: "failed" }))).toBe(false);
  });
});

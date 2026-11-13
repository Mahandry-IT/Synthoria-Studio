import { describe, expect, it, vi } from "vitest";
import { HttpError } from "@/shared/api/httpClient";
import {
  acceptExercisesOffer,
  EXERCISES_POLL_INTERVAL_MS,
  exercisesLaunchErrorMessage,
  isFreshCourse,
  exercisesPollIntervalMs,
  markExercisesPromptAsked,
  wasExercisesPromptAsked,
} from "./exercise.state";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("polling", () => {
  it("continue en pending/generating, s'arrête sinon", () => {
    expect(exercisesPollIntervalMs("pending")).toBe(EXERCISES_POLL_INTERVAL_MS);
    expect(exercisesPollIntervalMs("generating")).toBe(EXERCISES_POLL_INTERVAL_MS);
    for (const s of ["done", "failed", "absent", undefined] as const) expect(exercisesPollIntervalMs(s)).toBe(false);
  });
});

describe("mémorisation de la question", () => {
  it("ne la repose pas une fois posée, par cours", () => {
    const storage = memoryStorage();
    expect(wasExercisesPromptAsked("a", storage)).toBe(false);
    markExercisesPromptAsked("a", storage);
    expect(wasExercisesPromptAsked("a", storage)).toBe(true);
    expect(wasExercisesPromptAsked("b", storage)).toBe(false);
  });

  it("survit à un stockage qui lève une exception", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    expect(wasExercisesPromptAsked("a", broken)).toBe(false);
    expect(() => markExercisesPromptAsked("a", broken)).not.toThrow();
  });
});

describe("polling et erreurs de lecture", () => {
  it("s'arrête après 3 échecs consécutifs", () => {
    expect(exercisesPollIntervalMs("generating", 2)).toBe(EXERCISES_POLL_INTERVAL_MS);
    expect(exercisesPollIntervalMs("generating", 3)).toBe(false);
  });
});

describe("acceptExercisesOffer", () => {
  it("mémorise la question après un lancement réussi", async () => {
    const onLaunched = vi.fn();
    expect(await acceptExercisesOffer(() => Promise.resolve({ status: "pending" }), onLaunched)).toBe(true);
    expect(onLaunched).toHaveBeenCalledOnce();
  });

  it("ne mémorise rien sur 409, 429 ou erreur réseau", async () => {
    const onLaunched = vi.fn();
    for (const status of [409, 429, 0]) {
      expect(await acceptExercisesOffer(() => Promise.reject(new HttpError(status, "x")), onLaunched)).toBe(false);
    }
    expect(onLaunched).not.toHaveBeenCalled();
  });
});

describe("isFreshCourse", () => {
  const now = Date.parse("2026-01-01T12:00:00Z");
  it("vrai pour un cours de moins d'1 h", () => {
    expect(isFreshCourse("2026-01-01T11:30:00Z", now)).toBe(true);
  });
  it("faux pour un cours ancien, sans date ou à date illisible", () => {
    expect(isFreshCourse("2025-12-01T11:30:00Z", now)).toBe(false);
    expect(isFreshCourse("2026-01-01T10:30:00Z", now)).toBe(false);
    expect(isFreshCourse(undefined, now)).toBe(false);
    expect(isFreshCourse("n'importe quoi", now)).toBe(false);
  });
});

describe("exercisesLaunchErrorMessage", () => {
  const conflict = (detail: string) => new HttpError(409, "conflict", { detail });
  it("distingue quiz absent et cours incomplet, sans « réessayez » pour le quiz", () => {
    const quiz = exercisesLaunchErrorMessage(conflict("Le quiz du cours n'est pas terminé"));
    expect(quiz).toContain("quiz");
    expect(quiz.toLowerCase()).not.toContain("réessay");
    expect(exercisesLaunchErrorMessage(conflict("Le cours n'est pas terminé"))).toContain("section est incomplète");
  });
  it("repli neutre sans detail ; 429 inchangé", () => {
    expect(exercisesLaunchErrorMessage(new HttpError(409, "x"))).not.toContain("réessay");
    expect(exercisesLaunchErrorMessage(new HttpError(429, "x"))).toContain("Trop de demandes");
  });
});

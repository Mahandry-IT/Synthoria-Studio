import { describe, expect, it, vi } from "vitest";
import { HttpError } from "@/shared/api/httpClient";
import { checkAnswer, clearDraft, draftKey, EXERCISE_ANSWER_MAX_LENGTH, readDraft, writeDraft } from "./exerciseAnswer";
import { answerErrorMessage, detailError } from "./exerciseErrors";
import { hasMoreHints, nextHintCount, visibleHints } from "./exerciseHints";
import { buildSectionExerciseMap, sectionAnchorId } from "./exerciseLinks";
import { durationSeconds, formatMmSs, isTimeUp, remainingSeconds } from "./exerciseTimer";
import type { ExerciseList } from "./exercise.types";

const ID = "3f2b8a52-0d7c-4f6e-9c1a-6d5e4b3a2f10";

describe("minuteur", () => {
  it("durée en secondes, absente si invalide", () => {
    expect(durationSeconds(10)).toBe(600);
    expect(durationSeconds(0)).toBeNull();
    expect(durationSeconds(null)).toBeNull();
    expect(durationSeconds(Number.NaN)).toBeNull();
  });

  it("temps restant : décompte, arrondi au-dessus, jamais négatif", () => {
    expect(remainingSeconds(0, 0, 600)).toBe(600);
    expect(remainingSeconds(0, 1_500, 600)).toBe(599);
    expect(remainingSeconds(0, 600_000, 600)).toBe(0);
    expect(remainingSeconds(0, 9_999_999, 600)).toBe(0);
    expect(remainingSeconds(5_000, 0, 600)).toBe(600); // horloge qui recule
  });

  it("format mm:ss", () => {
    expect(formatMmSs(0)).toBe("00:00");
    expect(formatMmSs(65)).toBe("01:05");
    expect(formatMmSs(3600)).toBe("60:00");
    expect(formatMmSs(-4)).toBe("00:00");
  });

  it("état écoulé à zéro seulement", () => {
    expect(isTimeUp(1)).toBe(false);
    expect(isTimeUp(0)).toBe(true);
  });

  it("horloge simulée : décompte puis zéro", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const start = Date.now();
    vi.advanceTimersByTime(59_000);
    expect(remainingSeconds(start, Date.now(), 60)).toBe(1);
    vi.advanceTimersByTime(1_000);
    expect(isTimeUp(remainingSeconds(start, Date.now(), 60))).toBe(true);
    vi.useRealTimers();
  });
});

describe("indices", () => {
  const hints = ["général", "moyen", "précis"];

  it("révélés un par un, bornés au total", () => {
    expect(visibleHints(hints, 0)).toEqual([]);
    expect(nextHintCount(0, 3)).toBe(1);
    expect(visibleHints(hints, 2)).toEqual(["général", "moyen"]);
    expect(nextHintCount(3, 3)).toBe(3);
    expect(hasMoreHints(hints, 3)).toBe(false);
    expect(hasMoreHints(hints, 1)).toBe(true);
  });

  it("aucun indice : rien à révéler", () => {
    expect(nextHintCount(0, 0)).toBe(0);
    expect(hasMoreHints([], 0)).toBe(false);
  });
});

describe("réponse et brouillon", () => {
  it("envoi refusé si vide, trop long ou en cours", () => {
    expect(checkAnswer("  ", false).canSubmit).toBe(false);
    expect(checkAnswer("x", false).canSubmit).toBe(true);
    expect(checkAnswer("x", true).canSubmit).toBe(false);
    expect(checkAnswer("a".repeat(EXERCISE_ANSWER_MAX_LENGTH + 1), false)).toEqual({ tooLong: true, canSubmit: false });
    expect(checkAnswer("a".repeat(EXERCISE_ANSWER_MAX_LENGTH), false).canSubmit).toBe(true);
  });

  it("brouillon : écriture, lecture, effacement par exercice", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    writeDraft("s", ID, "ma réponse", storage);
    expect(readDraft("s", ID, storage)).toBe("ma réponse");
    expect(readDraft("s", "autre", storage)).toBe("");
    expect(data.has(draftKey("s", ID))).toBe(true);
    writeDraft("s", ID, "", storage);
    expect(readDraft("s", ID, storage)).toBe("");
    writeDraft("s", ID, "x", storage);
    clearDraft("s", ID, storage);
    expect(readDraft("s", ID, storage)).toBe("");
  });

  it("stockage qui lève : aucune exception", () => {
    const boom = () => {
      throw new Error("denied");
    };
    const storage = { getItem: boom, setItem: boom, removeItem: boom };
    expect(readDraft("s", ID, storage)).toBe("");
    expect(() => writeDraft("s", ID, "x", storage)).not.toThrow();
    expect(() => clearDraft("s", ID, storage)).not.toThrow();
  });
});

describe("messages d'erreur", () => {
  it.each([429, 502, 503])("correction %i : réponse conservée", (status) => {
    expect(answerErrorMessage(new HttpError(status, "x"))).toContain("réponse est conservée");
  });

  it("erreur 500 ou inconnue : la mention est ajoutée", () => {
    expect(answerErrorMessage(new HttpError(500, "x"))).toContain("Votre réponse est conservée.");
    expect(answerErrorMessage(new Error("boom"))).toContain("Votre réponse est conservée.");
  });

  it("detail du serveur déjà rassurant : pas de doublon", () => {
    const msg = answerErrorMessage(
      new HttpError(429, "x", { detail: "Réessayez dans un instant : votre réponse est conservée." }),
    );
    expect(msg.match(/conservée/gi)).toHaveLength(1);
  });

  it("détail : 404 revient à la liste, le reste se réessaie", () => {
    expect(detailError(new HttpError(404, "x")).kind).toBe("not_found");
    expect(detailError(new HttpError(500, "x")).kind).toBe("retryable");
    expect(detailError(new HttpError(0, "x")).kind).toBe("retryable");
  });
});

describe("table section → exercice", () => {
  const ex = (id: string, section_id: string | null, position: number) => ({
    id,
    section_id,
    position,
    title: id,
    covers: "",
    duration_minutes: null,
  });
  const list = (over: Partial<ExerciseList>): ExerciseList => ({
    status: "done",
    error_message: null,
    exercises: [ex("b", "s1", 2), ex("a", "s1", 1), ex("c", null, 3), ex("d", "s2", 4)],
    ...over,
  });

  it("liste prête : premier exercice par position, sans section ignoré", () => {
    const map = buildSectionExerciseMap(list({}));
    expect(map.get("s1")?.id).toBe("a");
    expect(map.get("s2")?.id).toBe("d");
    expect(map.size).toBe(2);
  });

  it.each(["absent", "pending", "generating", "failed"] as const)("statut %s : aucune entrée (RG-7)", (status) => {
    expect(buildSectionExerciseMap(list({ status })).size).toBe(0);
  });

  it("liste absente ou vide : aucune entrée", () => {
    expect(buildSectionExerciseMap(undefined).size).toBe(0);
    expect(buildSectionExerciseMap(list({ exercises: [] })).size).toBe(0);
  });

  it("ancre de section", () => {
    expect(sectionAnchorId("s1")).toBe("section-anchor-s1");
  });
});

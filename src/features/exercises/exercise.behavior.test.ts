import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAnswer, clearDraft, createDraftWriter, draftKey, DRAFT_DEBOUNCE_MS, readDraft } from "./exerciseAnswer";
import { isDetailFetchEnabled } from "./exerciseSession";
import { startCountdown } from "./exerciseTimer";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("décompte du minuteur", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const run = (totalSeconds: number) => {
    const ticks: number[] = [];
    const startedAtMs = performance.now();
    const stop = startCountdown({
      startedAtMs,
      totalSeconds,
      now: () => performance.now(),
      onTick: (r) => ticks.push(r),
    });
    return { ticks, stop };
  };

  it("décompte seconde par seconde", () => {
    const { ticks } = run(3);
    vi.advanceTimersByTime(2_000);
    expect(ticks).toEqual([2, 1]);
  });

  it("s'arrête de lui-même à zéro, sans minuterie restante", () => {
    const { ticks } = run(2);
    vi.advanceTimersByTime(10_000);
    expect(ticks).toEqual([1, 0]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("le nettoyage arrête les ticks", () => {
    const { ticks, stop } = run(10);
    vi.advanceTimersByTime(1_000);
    stop();
    vi.advanceTimersByTime(5_000);
    expect(ticks).toEqual([9]);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("envoi unique", () => {
  it("un envoi en cours bloque un second envoi", () => {
    expect(checkAnswer("ma réponse", false).canSubmit).toBe(true);
    expect(checkAnswer("ma réponse", true).canSubmit).toBe(false);
  });

  it("réponse vide ou trop longue : pas d'envoi", () => {
    expect(checkAnswer("   ", false).canSubmit).toBe(false);
    expect(checkAnswer("x".repeat(4001), false)).toEqual({ tooLong: true, canSubmit: false });
  });
});

describe("brouillon", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("« Refaire » : le brouillon est effacé", () => {
    const storage = memoryStorage();
    storage.setItem(draftKey("s", "e"), "ancienne réponse");
    clearDraft("s", "e", storage);
    expect(readDraft("s", "e", storage)).toBe("");
  });

  it("écriture retardée : une seule écriture, la dernière valeur", () => {
    const storage = memoryStorage();
    const setItem = vi.spyOn(storage, "setItem");
    const writer = createDraftWriter("s", "e", DRAFT_DEBOUNCE_MS, storage);
    writer.write("a");
    writer.write("ab");
    vi.advanceTimersByTime(DRAFT_DEBOUNCE_MS - 1);
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(setItem).toHaveBeenCalledOnce();
    expect(readDraft("s", "e", storage)).toBe("ab");
  });

  it("flush écrit tout de suite, sans second écrit ensuite", () => {
    const storage = memoryStorage();
    const setItem = vi.spyOn(storage, "setItem");
    const writer = createDraftWriter("s", "e", DRAFT_DEBOUNCE_MS, storage);
    writer.write("abc");
    writer.flush();
    expect(readDraft("s", "e", storage)).toBe("abc");
    vi.advanceTimersByTime(1_000);
    expect(setItem).toHaveBeenCalledOnce();
  });
});

describe("chargement du détail (RG-8)", () => {
  it("jamais avant « Commencer »", () => {
    expect(isDetailFetchEnabled(false, "s", "e")).toBe(false);
    expect(isDetailFetchEnabled(true, "s", "e")).toBe(true);
  });

  it("identifiants vides : pas de requête", () => {
    expect(isDetailFetchEnabled(true, "", "e")).toBe(false);
    expect(isDetailFetchEnabled(true, "s", "")).toBe(false);
  });
});

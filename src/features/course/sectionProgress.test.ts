import { describe, expect, it } from "vitest";
import {
  completeSection,
  EMPTY_PROGRESS,
  isExplanationVisible,
  isTrackable,
  sectionKey,
  unlockSection,
} from "./sectionProgress";

describe("sectionProgress", () => {
  it("l'explication est visible sans défi ou après l'avoir relevé", () => {
    expect(isExplanationVisible(EMPTY_PROGRESS, "1", false)).toBe(true);
    expect(isExplanationVisible(EMPTY_PROGRESS, "1", true)).toBe(false);
    expect(isExplanationVisible(unlockSection(EMPTY_PROGRESS, "1"), "1", true)).toBe(true);
  });

  it("terminer une section la déverrouille aussi, sans doublon", () => {
    const done = completeSection(completeSection(EMPTY_PROGRESS, "2"), "2");

    expect(done).toEqual({ unlocked: ["2"], done: ["2"] });
    expect(isExplanationVisible(done, "2", true)).toBe(true);
  });

  it("ne modifie pas l'état d'origine", () => {
    unlockSection(EMPTY_PROGRESS, "1");
    expect(EMPTY_PROGRESS).toEqual({ unlocked: [], done: [] });
  });

  it("sectionKey retombe sur la position, isTrackable exige des questions", () => {
    expect(sectionKey("7", 0)).toBe("7");
    expect(sectionKey(undefined, 3)).toBe("#3");
    expect(isTrackable(0)).toBe(false);
    expect(isTrackable(2)).toBe(true);
  });
});

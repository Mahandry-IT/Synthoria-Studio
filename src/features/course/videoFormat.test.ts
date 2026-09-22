import { describe, expect, it } from "vitest";
import { formatVideoDuration } from "./videoFormat";

describe("formatVideoDuration", () => {
  it("formate en mm:ss sous l'heure", () => {
    expect(formatVideoDuration(0)).toBe("0:00");
    expect(formatVideoDuration(65)).toBe("1:05");
    expect(formatVideoDuration(3599)).toBe("59:59");
  });

  it("formate en h:mm:ss à partir d'une heure", () => {
    expect(formatVideoDuration(3600)).toBe("1:00:00");
    expect(formatVideoDuration(3725)).toBe("1:02:05");
  });

  it("renvoie null sans durée connue ou invalide", () => {
    expect(formatVideoDuration(null)).toBeNull();
    expect(formatVideoDuration(undefined)).toBeNull();
    expect(formatVideoDuration(-5)).toBeNull();
    expect(formatVideoDuration(NaN)).toBeNull();
  });
});

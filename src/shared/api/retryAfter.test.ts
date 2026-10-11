import { describe, expect, it } from "vitest";
import { parseRetryAfter } from "./retryAfter";

describe("parseRetryAfter", () => {
  it("lit un nombre de secondes", () => {
    expect(parseRetryAfter("42")).toBe(42);
    expect(parseRetryAfter(" 7 ")).toBe(7);
    expect(parseRetryAfter("1.2")).toBe(2);
    expect(parseRetryAfter(30)).toBe(30);
  });

  it("lit une date HTTP relative à maintenant", () => {
    const now = Date.parse("Wed, 21 Oct 2026 07:28:00 GMT");
    expect(parseRetryAfter("Wed, 21 Oct 2026 07:28:30 GMT", now)).toBe(30);
    expect(parseRetryAfter("Wed, 21 Oct 2026 07:27:00 GMT", now)).toBe(0);
  });

  it("renvoie undefined si absent ou illisible", () => {
    expect(parseRetryAfter(undefined)).toBeUndefined();
    expect(parseRetryAfter("")).toBeUndefined();
    expect(parseRetryAfter("bientôt")).toBeUndefined();
    expect(parseRetryAfter("-5")).toBeUndefined();
  });
});

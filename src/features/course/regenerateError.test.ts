import { describe, expect, it } from "vitest";
import { HttpError } from "@/shared/api/httpClient";
import { regenerateErrorMessage } from "./regenerateError";

describe("regenerateErrorMessage", () => {
  it("429 : detail du backend + délai Retry-After", () => {
    const err = new HttpError(429, "HTTP 429", { detail: "Quota Gemini atteint." }, 42);
    expect(regenerateErrorMessage(err)).toBe("Quota Gemini atteint. Réessayez dans 42 s.");
  });

  it("429 sans detail ni Retry-After : message de repli", () => {
    const err = new HttpError(429, "HTTP 429", null);
    expect(regenerateErrorMessage(err)).toBe("Quota Gemini atteint. Réessayez dans quelques instants.");
  });

  it("autre statut : message standard (detail)", () => {
    const err = new HttpError(409, "HTTP 409", { detail: "Section déjà complète." });
    expect(regenerateErrorMessage(err)).toBe("Section déjà complète.");
  });
});

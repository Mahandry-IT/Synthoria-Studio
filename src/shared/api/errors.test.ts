import { describe, expect, it } from "vitest";
import { ERROR_MESSAGES, NETWORK_ERROR_MESSAGE, TIMEOUT_ERROR_MESSAGE } from "./errorMessages";
import { describeError, errorToastId, formatErrorDetails, resolveErrorMessage, shortRequestId } from "./errors";
import { HttpError } from "./httpClient";

const backendError = (status: number, body: unknown, meta = {}) => new HttpError(status, `HTTP ${status}`, body, meta);

describe("describeError", () => {
  it("lit le contrat d'erreur du backend", () => {
    const err = backendError(
      429,
      { detail: "Quota Gemini atteint.", error_code: "gemini_quota", request_id: "abcd1234-ef", debug: { type: "X" } },
      { retryAfterSeconds: 42, method: "POST", url: "/courses/s/sections/1/regenerate" },
    );
    expect(describeError(err)).toEqual({
      kind: "http",
      message: "Quota Gemini atteint.",
      status: 429,
      method: "POST",
      url: "/courses/s/sections/1/regenerate",
      errorCode: "gemini_quota",
      requestId: "abcd1234-ef",
      debug: { type: "X" },
      retryAfterSeconds: 42,
    });
  });

  it("prend le request_id de l'en-tête si le corps n'en a pas", () => {
    expect(describeError(backendError(500, null, { requestId: "hdr-id" })).requestId).toBe("hdr-id");
  });

  it("sans detail : message du contexte, puis message générique par statut", () => {
    expect(resolveErrorMessage(backendError(404, null), { 404: "Plan introuvable." })).toBe("Plan introuvable.");
    expect(resolveErrorMessage(backendError(404, null))).toBe(ERROR_MESSAGES[404]);
    expect(resolveErrorMessage(backendError(418, null))).toBe("Erreur 418.");
  });

  it("un 404 générique ne parle plus de plan", () => {
    expect(resolveErrorMessage(backendError(404, {}))).not.toMatch(/plan/i);
  });

  it("detail liste (422 FastAPI historique) : message générique", () => {
    expect(resolveErrorMessage(backendError(422, { detail: [{ msg: "x" }] }))).toBe(ERROR_MESSAGES[422]);
  });

  it("dé-imbrique un detail encodé en JSON", () => {
    expect(resolveErrorMessage(backendError(400, { detail: '{"detail":"Vrai message"}' }))).toBe("Vrai message");
  });

  it("distingue erreur réseau et délai dépassé", () => {
    expect(describeError(backendError(0, null)).kind).toBe("network");
    expect(resolveErrorMessage(backendError(0, null))).toBe(NETWORK_ERROR_MESSAGE);
    const timeout = backendError(0, null, { code: "ECONNABORTED" });
    expect(describeError(timeout).kind).toBe("timeout");
    expect(resolveErrorMessage(timeout)).toBe(TIMEOUT_ERROR_MESSAGE);
  });

  it("erreurs non HTTP", () => {
    expect(resolveErrorMessage(new Error("boom"))).toBe("boom");
    expect(resolveErrorMessage("texte")).toBe("texte");
    expect(resolveErrorMessage(undefined)).toBe("Une erreur inattendue est survenue.");
  });
});

describe("errorToastId", () => {
  it("identique pour deux erreurs identiques, distinct sinon", () => {
    const a = describeError(backendError(503, { error_code: "gemini_unavailable" }, { method: "GET", url: "/podcasts/1" }));
    const b = describeError(backendError(503, { error_code: "gemini_unavailable" }, { method: "GET", url: "/podcasts/1" }));
    const c = describeError(backendError(503, { error_code: "gemini_unavailable" }, { method: "GET", url: "/podcasts/2" }));
    expect(errorToastId(a)).toBe(errorToastId(b));
    expect(errorToastId(a)).not.toBe(errorToastId(c));
  });
});

describe("shortRequestId / formatErrorDetails", () => {
  it("raccourcit l'identifiant", () => {
    expect(shortRequestId("3f6f1c1e-9d0a-4c6e")).toBe("3f6f1c1e");
    expect(shortRequestId(undefined)).toBeUndefined();
  });

  it("formate les détails copiables", () => {
    const info = describeError(backendError(500, { error_code: "internal_error", request_id: "rid", debug: "Trace" }, { method: "GET", url: "/x" }));
    const text = formatErrorDetails(info, new Date("2026-10-09T10:00:00Z"));
    expect(text).toContain("Statut : 500");
    expect(text).toContain("Requête : GET /x");
    expect(text).toContain("error_code : internal_error");
    expect(text).toContain("request_id : rid");
    expect(text).toContain("Date : 2026-10-09T10:00:00.000Z");
    expect(text).toContain('debug : "Trace"');
  });
});

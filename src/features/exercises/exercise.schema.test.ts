import { describe, expect, it } from "vitest";
import {
  exerciseAnswerRequestSchema,
  exerciseDetailSchema,
  exerciseEnqueueResponseSchema,
  exerciseFeedbackSchema,
  exerciseListSchema,
} from "./exercise.schema";

const ID = "3f2b8a52-0d7c-4f6e-9c1a-6d5e4b3a2f10";

describe("exerciseListSchema", () => {
  it("accepte une liste complète", () => {
    const parsed = exerciseListSchema.parse({
      status: "done",
      error_message: null,
      exercises: [{ id: ID, section_id: "s1", position: 1, title: "T", covers: "C" }],
    });
    expect(parsed.exercises[0].title).toBe("T");
  });

  it("tolère les champs absents ou null", () => {
    const parsed = exerciseListSchema.parse({ status: "absent", exercises: [{ id: ID, section_id: null }] });
    expect(parsed.error_message).toBeNull();
    expect(parsed.exercises[0]).toMatchObject({ section_id: null, title: "", covers: "", position: 0 });
    expect(exerciseListSchema.parse({ status: "pending" }).exercises).toEqual([]);
  });

  it("traite un statut inconnu comme un échec", () => {
    expect(exerciseListSchema.parse({ status: "weird" }).status).toBe("failed");
  });

  it("rejette un identifiant d'exercice invalide", () => {
    expect(exerciseListSchema.safeParse({ status: "done", exercises: [{ id: "x" }] }).success).toBe(false);
  });

  it("ignore un énoncé éventuel (RG-8)", () => {
    const parsed = exerciseListSchema.parse({ status: "done", exercises: [{ id: ID, statement: "secret" }] });
    expect(parsed.exercises[0]).not.toHaveProperty("statement");
  });
});

describe("autres schémas", () => {
  it("valide la réponse 202", () => {
    expect(exerciseEnqueueResponseSchema.parse({ status: "pending" }).status).toBe("pending");
  });

  it("refuse une réponse vide ou un champ en trop", () => {
    expect(exerciseAnswerRequestSchema.safeParse({ answer: "  " }).success).toBe(false);
    expect(exerciseAnswerRequestSchema.safeParse({ answer: "a", extra: 1 }).success).toBe(false);
  });

  it("complète la correction", () => {
    expect(exerciseFeedbackSchema.parse({ feedback: "ok" }).correct_points).toEqual([]);
  });
});

describe("exerciseDetailSchema", () => {
  it("accepte un énoncé en blocs de contenu", () => {
    const parsed = exerciseDetailSchema.parse({
      id: ID,
      title: "T",
      statement: [{ type: "paragraph", text: "Calculez A x B." }, { type: "list", list_items: ["a", "b"] }],
      hints: ["indice"],
    });
    expect(parsed.statement).toHaveLength(2);
    expect(parsed.statement[0]).toMatchObject({ type: "paragraph", text: "Calculez A x B." });
    expect(parsed.hints).toEqual(["indice"]);
  });

  it("tolère un énoncé absent, mal typé ou contenant un bloc invalide", () => {
    expect(exerciseDetailSchema.parse({ id: ID }).statement).toEqual([]);
    expect(exerciseDetailSchema.parse({ id: ID, statement: "texte" }).statement).toEqual([]);
    const parsed = exerciseDetailSchema.parse({ id: ID, statement: [{ nope: 1 }, { type: "paragraph", text: "ok" }] });
    expect(parsed.statement).toHaveLength(1);
  });
});

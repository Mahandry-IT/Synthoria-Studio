import { describe, expect, it } from "vitest";
import { courseResponseSchema, courseSectionSchema } from "./course.schema";
import {
  rawChallenge,
  rawCycle,
  rawSection,
  rawSteps,
  rawTable,
  rawTrapsCards,
  rawTrapsRewrite,
  rawTrialCard,
} from "./cycle.fixtures";
import { cycleStages, hasCycle } from "./cycleFormat";

const parse = (cycle: unknown) => courseSectionSchema.parse(rawSection(cycle));

describe("lecture du cycle (zod tolérant)", () => {
  it("ancien cours : JSON valide sans cycle, jamais d'erreur", () => {
    const old = courseResponseSchema.parse({
      mode: "question_only",
      format: "full_course",
      meta: {},
      sections: [{ id: "a", title: "Ancienne", quoi: "Q", pourquoi: "P", comment: "C" }],
    });
    const section = old.sections?.[0];
    expect(section?.cycle).toBeUndefined();
    expect(hasCycle(section ?? {})).toBe(false);
  });

  it("cycle complet : tous les temps lus dans l'ordre, durée normalisée", () => {
    const section = parse(rawCycle);
    expect(section.cycle?.challenge.correct_indices).toEqual([0]);
    expect(section.cycle?.steps).toHaveLength(3);
    expect(section.cycle?.steps[0].support?.kind).toBe("table");
    expect(section.cycle?.steps[0].prediction?.kind).toBe("value");
    expect(section.cycle?.vocabulary).toHaveLength(2);
    expect(section.cycle?.traps?.mode).toBe("spot");
    expect(section.cycle?.trial?.kind).toBe("qcm");
    expect([section.cycle?.minutes_min, section.cycle?.minutes_max]).toEqual([4, 6]);
    expect(cycleStages(section)).toEqual(["challenge", "steps", "vocabulary", "traps", "trial"]);
    expect(hasCycle(section)).toBe(true);
  });

  it("cycle partiel : un temps absent est sauté", () => {
    const section = parse({ ...rawCycle, vocabulary: [], traps: undefined });
    expect(cycleStages(section)).toEqual(["challenge", "steps", "trial"]);
  });

  it("clés absentes (pas seulement nulles) : étape sans support, cycle sans pièges ni épreuve ni vocabulaire", () => {
    const section = parse({ challenge: rawChallenge, steps: [{ text: "Juste du texte." }] });
    expect(section.cycle?.steps[0].support).toBeUndefined();
    expect(section.cycle?.traps).toBeUndefined();
    expect(section.cycle?.trial).toBeUndefined();
    expect(cycleStages(section)).toEqual(["challenge", "steps"]);
  });

  it("cycle sans durée : pas de durée ; bornes inversées : remises dans l'ordre", () => {
    expect(parse({ ...rawCycle, minutes_min: undefined, minutes_max: undefined }).cycle?.minutes_min).toBeUndefined();
    const swapped = parse({ ...rawCycle, minutes_min: 7, minutes_max: 3 }).cycle;
    expect([swapped?.minutes_min, swapped?.minutes_max]).toEqual([3, 7]);
  });

  it.each([
    ["défi absent", { ...rawCycle, challenge: undefined }],
    ["défi avec toutes les options correctes", { ...rawCycle, challenge: { ...rawChallenge, correct_indices: [0, 1, 2, 3] } }],
    ["défi avec indice hors bornes", { ...rawCycle, challenge: { ...rawChallenge, correct_indices: [9] } }],
    ["aucune étape", { ...rawCycle, steps: [] }],
    ["étapes non tableau", { ...rawCycle, steps: "x" }],
    ["cycle non objet", "texte"],
    ["cycle null", null],
  ])("cycle invalide ignoré (%s) : la section reste lisible", (_name, cycle) => {
    const section = parse(cycle);
    expect(section.title).toBe("La loi d'Ohm");
    expect(section.cycle).toBeUndefined();
    expect(hasCycle(section)).toBe(false);
  });

  it("élément invalide écarté seul : étape sans texte, terme vide, prédiction incohérente", () => {
    const section = parse({
      ...rawCycle,
      steps: [
        { text: "", support: rawSteps[0].support },
        {
          ...rawSteps[0],
          prediction: { kind: "choice", question: "?", options: ["a", "b"], correct_index: 5, outcome: "x" },
        },
      ],
      vocabulary: [{ term: "", plain: "x" }, { term: "ok", plain: "y" }],
    }).cycle;
    expect(section?.steps).toHaveLength(1);
    expect(section?.steps[0].prediction).toBeUndefined(); // prédiction invalide ignorée, étape conservée
    expect(section?.vocabulary.map((v) => v.term)).toEqual(["ok"]);
  });

  it("support invalide : l'étape garde son texte sans support", () => {
    const section = parse({
      ...rawCycle,
      steps: [{ text: "Texte", support: { kind: "classify", categories: ["A"], cases: [] } }],
    }).cycle;
    expect(section?.steps[0].support).toBeUndefined();
    expect(section?.steps[0].text).toBe("Texte");
  });

  it("fill_table : cases hors tableau écartées ; sans case valide, retombe en tableau simple", () => {
    const kept = parse({
      ...rawCycle,
      steps: [{ text: "t", support: { kind: "fill_table", table: rawTable, blanks: [{ row: 0, col: 2 }, { row: 9, col: 0 }] } }],
    }).cycle?.steps[0].support;
    expect(kept?.kind === "fill_table" && kept.blanks).toEqual([{ row: 0, col: 2 }]);
    const plain = parse({
      ...rawCycle,
      steps: [{ text: "t", support: { kind: "fill_table", table: rawTable, blanks: [{ row: 9, col: 9 }] } }],
    }).cycle?.steps[0].support;
    expect(plain?.kind).toBe("table");
  });

  it("tableau trop grand : tronqué à 8 lignes et 6 colonnes, support conservé, cases masquées dans les bornes", () => {
    const rows = Array.from({ length: 10 }, (_, r) => Array.from({ length: 8 }, (_, c) => `r${r}c${c}`));
    const table = { caption: "", headers: Array.from({ length: 8 }, (_, c) => `h${c}`), rows };
    const support = (s: object) => parse({ ...rawCycle, steps: [{ text: "t", support: s }] }).cycle?.steps[0].support;
    const plain = support({ kind: "table", table });
    expect(plain?.kind === "table" && [plain.table.headers.length, plain.table.rows.length, plain.table.rows[0].length]).toEqual([6, 8, 6]);
    const fill = support({
      kind: "fill_table",
      table,
      blanks: [{ row: 1, col: 1 }, { row: 9, col: 1 }, { row: 1, col: 7 }],
    });
    expect(fill?.kind === "fill_table" && fill.blanks).toEqual([{ row: 1, col: 1 }]);
  });

  it("widget d'étape : html vide ignoré, valide conservé", () => {
    const step = (widget: unknown) => parse({ ...rawCycle, steps: [{ ...rawSteps[0], widget }] }).cycle?.steps[0].widget;
    expect(step({ title: "w", description: "d", html: "  " })).toBeUndefined();
    expect(step({ title: "w", description: "d", html: "<div>ok</div>" })?.html).toBe("<div>ok</div>");
    expect(step({ nope: 1 })).toBeUndefined();
  });

  it("pièges : cards sans affirmation et spot_rewrite sans reformulation valide sont écartés", () => {
    expect(parse({ ...rawCycle, traps: rawTrapsCards }).cycle?.traps?.entries).toHaveLength(1);
    expect(parse({ ...rawCycle, traps: { mode: "cards", entries: [{ claim: "", explanation: "e" }] } }).cycle?.traps).toBeUndefined();
    expect(parse({ ...rawCycle, traps: rawTrapsRewrite }).cycle?.traps?.mode).toBe("spot_rewrite");
    const broken = { mode: "spot_rewrite", entries: [{ ...rawTrapsRewrite.entries[0], correct_rewrite_index: 7 }] };
    expect(parse({ ...rawCycle, traps: broken }).cycle?.traps).toBeUndefined();
  });

  it("épreuve : question invalide écartée, carte lue, épreuve vide ignorée", () => {
    const bad = { kind: "choice", question: "Q", options: ["a", "b"], correct_option_indices: [5] };
    const trial = parse({ ...rawCycle, trial: { kind: "qcm", questions: [bad] } }).cycle?.trial;
    expect(trial).toBeUndefined();
    const card = parse({ ...rawCycle, trial: rawTrialCard }).cycle?.trial;
    expect(card?.kind === "exercise_card" && card.card.steps).toHaveLength(2);
  });

  it("textes trop longs : l'élément est écarté, le cycle reste lisible", () => {
    const section = parse({
      ...rawCycle,
      steps: [rawSteps[1], { text: "x".repeat(501) }],
      vocabulary: [{ term: "t", plain: "y".repeat(301) }, { term: "ok", plain: "fine" }],
    }).cycle;
    expect(section?.steps).toHaveLength(1); // borne de 500 caractères
    expect(section?.vocabulary.map((v) => v.term)).toEqual(["ok"]); // borne de 300 caractères
  });
});

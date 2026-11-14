import { z } from "zod";
import {
  courseChartSchema,
  courseDiagramSchema,
  courseTableSchema,
  courseWidgetSchema,
  quizQuestionSchema,
} from "./courseLeaf.schema";
import type {
  CycleChallenge,
  CycleStep,
  CycleTrial,
  CycleTraps,
  ExerciseCard,
  QuizQuestion,
  SectionCycle,
  StepPrediction,
  StepSupport,
  TrapEntry,
  TrapMode,
  VocabTerm,
} from "./course.types";

/**
 * Lecture tolérante du format « cycle » d'une section (miroir des bornes d'`ApiSectionCycle`).
 * Règle : un champ absent ou invalide ne fait JAMAIS échouer la lecture du cours. Un élément invalide
 * (étape, terme, piège, question) est écarté seul ; un cycle sans défi valide ou sans aucune étape
 * valide est ignoré en entier, et la section retombe sur le lecteur historique.
 */

export const CYCLE_LIMITS = {
  question: 400,
  option: 160,
  feedback: 300,
  stepText: 500,
  action: 200,
  caption: 120,
  cell: 120,
  label: 100,
  category: 60,
  item: 120,
  outcome: 300,
  unit: 20,
  term: 80,
  plain: 300,
  formula: 200,
  claim: 160,
  explanation: 400,
  cardStatement: 700,
  cardLine: 300,
  thread: 200,
  steps: 8,
  tableRows: 8,
  tableCols: 6,
  options: 6,
  items: 8,
  vocabulary: 10,
  trapEntries: 4,
  trialQuestions: 3,
  trialOptions: 5,
  cardSteps: 6,
  blanks: 4,
  distractors: 3,
  categories: 4,
  minutes: 30,
} as const;

const text = (max: number) => z.string().trim().min(1).max(max);
const optText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => v ?? "");

/** Tableau tolérant : un élément invalide est écarté sans faire échouer le reste. */
function lenient<T extends z.ZodTypeAny>(item: T, max: number) {
  return z
    .array(z.unknown())
    .nullish()
    .transform((arr) =>
      (arr ?? [])
        .flatMap((el) => {
          const r = item.safeParse(el);
          return r.success ? [r.data as z.output<T>] : [];
        })
        .slice(0, max),
    );
}

const validIndex = (i: number | null | undefined, length: number): i is number =>
  typeof i === "number" && Number.isInteger(i) && i >= 0 && i < length;

// ─── Défi ───────────────────────────────────────────────────

const challengeSchema = z
  .object({
    question: text(CYCLE_LIMITS.question),
    options: z.array(text(CYCLE_LIMITS.option)).min(2).max(CYCLE_LIMITS.options),
    correct_indices: z.array(z.number().int()).min(1),
    feedback: optText(CYCLE_LIMITS.feedback),
  })
  .refine(
    (c) =>
      c.correct_indices.every((i) => validIndex(i, c.options.length)) &&
      new Set(c.correct_indices).size === c.correct_indices.length &&
      c.correct_indices.length < c.options.length,
    { message: "correct_indices invalide" },
  );

// ─── Supports des mini-étapes ───────────────────────────────

const cellRefSchema = z.object({ row: z.number().int().min(0), col: z.number().int().min(0) });

const flatSupportSchema = z.object({
  kind: z.enum(["chart", "diagram", "table", "fill_table", "classify", "order", "match"]),
  caption: optText(CYCLE_LIMITS.caption),
  chart: courseChartSchema.nullish().catch(null),
  diagram: courseDiagramSchema.nullish().catch(null),
  table: courseTableSchema.nullish().catch(null),
  blanks: lenient(cellRefSchema, CYCLE_LIMITS.blanks),
  distractors: lenient(text(CYCLE_LIMITS.cell), CYCLE_LIMITS.distractors),
  categories: lenient(text(CYCLE_LIMITS.category), CYCLE_LIMITS.categories),
  cases: lenient(
    z.object({ label: text(CYCLE_LIMITS.label), category_index: z.number().int().min(0) }),
    CYCLE_LIMITS.items,
  ),
  order_items: lenient(text(CYCLE_LIMITS.item), CYCLE_LIMITS.items),
  order_criterion: optText(CYCLE_LIMITS.item),
  match_pairs: lenient(z.object({ left: text(CYCLE_LIMITS.label), right: text(CYCLE_LIMITS.label) }), CYCLE_LIMITS.items),
});

type FlatSupport = z.output<typeof flatSupportSchema>;
type Table = NonNullable<FlatSupport["table"]>;

/** Tableau exploitable (au moins un en-tête et une cellule non vide), tronqué aux bornes du contrat. */
function usableTable(table: FlatSupport["table"]): Table | null {
  if (!table || table.headers.length === 0) return null;
  const bounded: Table = {
    caption: table.caption,
    headers: table.headers.slice(0, CYCLE_LIMITS.tableCols),
    rows: table.rows.slice(0, CYCLE_LIMITS.tableRows).map((row) => row.slice(0, CYCLE_LIMITS.tableCols)),
  };
  return bounded.rows.some((row) => row.some((cell) => cell.trim())) ? bounded : null;
}

/** Cases masquées : dans le tableau, non vides, sans doublon. Aucune case valide : le tableau reste un support. */
function fillTableSupport(flat: FlatSupport, table: Table): StepSupport {
  const seen = new Set<string>();
  const blanks = flat.blanks.filter((b) => {
    const key = `${b.row}:${b.col}`;
    const answer = validIndex(b.row, table.rows.length) && validIndex(b.col, table.headers.length) ? table.rows[b.row][b.col] : "";
    if (!answer?.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (blanks.length === 0) return { kind: "table", caption: flat.caption, table };
  return { kind: "fill_table", caption: flat.caption, table, blanks, distractors: flat.distractors };
}

function classifySupport(flat: FlatSupport): StepSupport | null {
  const cases = flat.cases.filter((c) => validIndex(c.category_index, flat.categories.length));
  if (flat.categories.length < 2 || cases.length < 2) return null;
  return { kind: "classify", caption: flat.caption, categories: flat.categories, cases };
}

/** Support d'une mini-étape ; null s'il est inexploitable (l'étape garde son texte, sans support). */
export function parseSupport(raw: unknown): StepSupport | null {
  const parsed = flatSupportSchema.safeParse(raw);
  if (!parsed.success) return null;
  const flat = parsed.data;
  const { kind, caption } = flat;
  switch (kind) {
    case "chart":
      return flat.chart && flat.chart.labels.length > 0 && flat.chart.series.length > 0
        ? { kind, caption, chart: flat.chart }
        : null;
    case "diagram":
      return flat.diagram?.mermaid.trim() ? { kind, caption, diagram: flat.diagram } : null;
    case "table": {
      const table = usableTable(flat.table);
      return table ? { kind, caption, table } : null;
    }
    case "fill_table": {
      const table = usableTable(flat.table);
      return table ? fillTableSupport(flat, table) : null;
    }
    case "classify":
      return classifySupport(flat);
    case "order":
      return flat.order_items.length >= 2
        ? { kind, caption, order_items: flat.order_items, order_criterion: flat.order_criterion }
        : null;
    case "match":
      return flat.match_pairs.length >= 2 ? { kind, caption, match_pairs: flat.match_pairs } : null;
  }
}

// ─── Prédiction et étapes ───────────────────────────────────

const predictionSchema = z
  .object({
    kind: z.enum(["choice", "value"]),
    question: text(CYCLE_LIMITS.question),
    options: z.array(text(CYCLE_LIMITS.option)).max(4).nullish().transform((v) => v ?? []),
    correct_index: z.number().int().nullish().transform((v) => v ?? null),
    expected_value: z.number().nullish().transform((v) => v ?? null),
    tolerance: z.number().min(0).nullish().transform((v) => v ?? 0),
    unit: optText(CYCLE_LIMITS.unit),
    outcome: text(CYCLE_LIMITS.outcome),
  })
  .refine((p) =>
    p.kind === "choice" ? p.options.length >= 2 && validIndex(p.correct_index, p.options.length) : p.expected_value !== null,
  );

const stepSchema = z.object({
  text: text(CYCLE_LIMITS.stepText),
  action: optText(CYCLE_LIMITS.action),
  support: z.unknown().optional().transform((raw) => parseSupport(raw) ?? undefined),
  // Prédiction ou widget invalide : ignoré, le reste de l'étape (et son repli de reconstruction) reste utilisable.
  prediction: predictionSchema.nullish().catch(null).transform((v): StepPrediction | undefined => v ?? undefined),
  widget: courseWidgetSchema
    .nullish()
    .catch(null)
    .transform((v) => (v?.html?.trim() ? v : undefined)),
});

// ─── Vocabulaire, pièges, épreuve ───────────────────────────

const vocabSchema = z.object({
  term: text(CYCLE_LIMITS.term),
  plain: text(CYCLE_LIMITS.plain),
  formula_latex: optText(CYCLE_LIMITS.formula),
});

const trapEntrySchema = z.object({
  claim: optText(CYCLE_LIMITS.claim),
  statements: z.array(text(CYCLE_LIMITS.claim)).max(5).nullish().transform((v) => v ?? []),
  wrong_index: z.number().int().nullish().transform((v) => v ?? null),
  explanation: text(CYCLE_LIMITS.explanation),
  rewrite_options: z.array(text(CYCLE_LIMITS.claim)).max(4).nullish().transform((v) => v ?? []),
  correct_rewrite_index: z.number().int().nullish().transform((v) => v ?? null),
});

/** Une entrée exploitable selon le mode (`cards` : affirmation ; `spot` : 2+ affirmations ; `spot_rewrite` : + reformulations). */
function isUsableTrap(mode: TrapMode, e: TrapEntry): boolean {
  if (mode === "cards") return e.claim.trim().length > 0;
  const spotOk = e.statements.length >= 2 && validIndex(e.wrong_index, e.statements.length);
  if (mode === "spot") return spotOk;
  return spotOk && e.rewrite_options.length >= 2 && validIndex(e.correct_rewrite_index, e.rewrite_options.length);
}

function parseTraps(raw: unknown): CycleTraps | undefined {
  const head = z.object({ mode: z.enum(["cards", "spot", "spot_rewrite"]), entries: z.unknown().optional() }).safeParse(raw);
  if (!head.success) return undefined;
  const { mode } = head.data;
  const entries = lenient(trapEntrySchema, CYCLE_LIMITS.trapEntries)
    .parse(head.data.entries)
    .filter((e) => isUsableTrap(mode, e));
  return entries.length > 0 ? { mode, entries } : undefined;
}

/** Question d'épreuve exploitable : choix (2+ options, bonnes réponses valides) ou numérique (valeur attendue finie). */
function parseTrialQuestion(raw: unknown): QuizQuestion | null {
  const parsed = quizQuestionSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.question.trim()) return null;
  const q = parsed.data;
  if (q.kind === "numeric") return q.expected_value == null ? null : (q as QuizQuestion);
  if (q.kind !== "choice") return null;
  const n = q.options.length;
  const ok =
    n >= 2 &&
    n <= CYCLE_LIMITS.trialOptions &&
    q.correct_option_indices.length > 0 &&
    q.correct_option_indices.every((i) => validIndex(i, n));
  return ok ? (q as QuizQuestion) : null;
}

const cardSchema = z.object({
  statement: text(CYCLE_LIMITS.cardStatement),
  hint: optText(CYCLE_LIMITS.cardLine),
  steps: z.array(text(CYCLE_LIMITS.cardLine)).min(1).max(CYCLE_LIMITS.cardSteps),
  result: optText(CYCLE_LIMITS.cardLine),
});

function parseTrial(raw: unknown): CycleTrial | undefined {
  const head = z.object({ kind: z.enum(["qcm", "exercise_card"]), questions: z.unknown().optional(), card: z.unknown().optional() }).safeParse(raw);
  if (!head.success) return undefined;
  if (head.data.kind === "exercise_card") {
    const card = cardSchema.safeParse(head.data.card);
    return card.success ? { kind: "exercise_card", card: card.data as ExerciseCard } : undefined;
  }
  const items = Array.isArray(head.data.questions) ? head.data.questions : [];
  const questions = items
    .map(parseTrialQuestion)
    .filter((q): q is QuizQuestion => q !== null)
    .slice(0, CYCLE_LIMITS.trialQuestions);
  return questions.length > 0 ? { kind: "qcm", questions } : undefined;
}

// ─── Cycle complet ──────────────────────────────────────────

const minutesSchema = z.number().int().min(1).max(CYCLE_LIMITS.minutes).nullish().catch(null);

const cycleHeadSchema = z.object({
  thread: optText(CYCLE_LIMITS.thread).catch(""),
  challenge: z.unknown().optional(),
  steps: z.unknown().optional(),
  vocabulary: z.unknown().optional(),
  traps: z.unknown().optional(),
  trial: z.unknown().optional(),
  minutes_min: minutesSchema,
  minutes_max: minutesSchema,
});

/** Durées cohérentes : deux bornes, min <= max ; une seule borne ou un ordre inversé est corrigé ou ignoré. */
function normalizeMinutes(min: number | null | undefined, max: number | null | undefined): Pick<SectionCycle, "minutes_min" | "minutes_max"> {
  if (min == null && max == null) return {};
  const low = min ?? (max as number);
  const high = max ?? (min as number);
  return { minutes_min: Math.min(low, high), minutes_max: Math.max(low, high) };
}

/** `cycle` brut de l'API → cycle exploitable, ou undefined (section sans cycle). Ne lève jamais. */
export function parseSectionCycle(raw: unknown): SectionCycle | undefined {
  const head = cycleHeadSchema.safeParse(raw);
  if (!head.success) return undefined;
  const challenge = challengeSchema.safeParse(head.data.challenge);
  const steps = lenient(stepSchema, CYCLE_LIMITS.steps).safeParse(head.data.steps);
  if (!challenge.success || !steps.success || steps.data.length === 0) return undefined;
  const vocabulary = lenient(vocabSchema, CYCLE_LIMITS.vocabulary).safeParse(head.data.vocabulary);
  return {
    thread: head.data.thread,
    challenge: challenge.data as CycleChallenge,
    steps: steps.data as CycleStep[],
    vocabulary: (vocabulary.success ? vocabulary.data : []) as VocabTerm[],
    traps: parseTraps(head.data.traps),
    trial: parseTrial(head.data.trial),
    ...normalizeMinutes(head.data.minutes_min, head.data.minutes_max),
  };
}

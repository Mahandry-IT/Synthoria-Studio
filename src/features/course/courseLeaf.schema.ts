import { z } from "zod";

// Schémas feuilles partagés (tableau, graphique, schéma, widget, question de quiz) : aucun import interne,
// pour que `course.schema.ts` et `cycleSchema.ts` puissent les utiliser sans cycle de modules.

export const courseTableSchema = z.object({
  caption: z.string().optional().default(""),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

const CHART_STEPS_MAX = 8;

const chartStepSchema = z.object({
  caption: z.string(),
  highlight_labels: z.array(z.number().int().min(0)).optional().default([]),
  highlight_series: z.array(z.number().int().min(0)).optional().default([]),
});

/** Étapes tolérantes : tout ce qui n'est pas une étape valide est écarté (le graphique reste affiché sans). */
function parseChartSteps(raw: unknown): z.infer<typeof chartStepSchema>[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = chartStepSchema.safeParse(item);
    return parsed.success && parsed.data.caption.trim() ? [parsed.data] : [];
  }).slice(0, CHART_STEPS_MAX);
}

export const courseDiagramSchema = z.object({
  kind: z.enum(["flowchart", "sequence", "hierarchy", "cycle"]),
  caption: z.string().optional().default(""),
  mermaid: z.string(),
});

export const courseChartSchema = z.object({
  kind: z.enum(["bar", "line", "pie"]),
  caption: z.string().optional().default(""),
  labels: z.array(z.string()),
  series: z.array(z.object({ name: z.string(), values: z.array(z.number()) })),
  steps: z.unknown().transform(parseChartSteps),
});

export const courseWidgetSchema = z.object({
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  html: z.string(),
  height_hint: z.number().nullish(),
});

export const quizQuestionKindSchema = z.enum(["choice", "numeric", "matching"]);

export const quizQuestionSchema = z.object({
  /** Absent (anciennes questions) ou inconnu : retombe sur `choice` sans casser la lecture. */
  kind: quizQuestionKindSchema.catch("choice"),
  question: z.string(),
  /** Vide pour une question numérique. */
  options: z.array(z.string()).default([]),
  /** Numérique : valeur attendue, renseignée seulement dans la correction. */
  expected_value: z.number().nullable().optional().catch(null),
  unit: z.string().nullable().optional().catch(null),
  /** Appariement : sujets, et option attendue par sujet (vide avant correction). */
  subjects: z.array(z.string()).optional().catch([]),
  correct_matches: z.array(z.number()).optional().catch([]),
  /** Indices 0-based des bonnes réponses (1 = unique, >1 = QCM multiple) */
  correct_option_indices: z.array(z.number()).default([]),
  /** Niveau de difficulté */
  difficulty: z.enum(["facile", "normale", "difficile"]).default("normale"),
  /** Points alloués (calculé côté serveur, total = 20/20) */
  points: z.number().min(0).default(1),
  explanation: z.string().optional().default(""),
  /** Retour par option (bonne réponse ou distracteur), dans l'ordre des options */
  explanation_per_choice: z.array(z.string()).optional().default([]),
  /** Sections (position 1-based) mobilisées par la question (quiz final) */
  section_refs: z.array(z.number()).optional().default([]),
  /** 45s par défaut, 80s si la question implique un calcul */
  time_limit_seconds: z.number().default(45),
});


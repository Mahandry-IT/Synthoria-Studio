/** Données de test : sections au format « cycle » telles que l'API les envoie (JSON brut). */

export const rawChallenge = {
  question: "Que se passe-t-il quand on double la tension ?",
  options: ["Le courant double", "Le courant est divisé par deux", "La résistance double", "Rien ne change"],
  correct_indices: [0],
  feedback: "Avec R constante, I = U / R double bien.",
};

export const rawTable = {
  caption: "Loi d'Ohm",
  headers: ["Tension", "Résistance", "Courant"],
  rows: [
    ["10 V", "5 Ω", "2 A"],
    ["20 V", "5 Ω", "4 A"],
  ],
};

export const rawSteps = [
  {
    text: "On branche une résistance fixe.",
    action: "Observe le tableau.",
    support: { kind: "table", caption: "", table: rawTable },
    prediction: {
      kind: "value",
      question: "Quel courant pour 20 V ?",
      expected_value: 4,
      tolerance: 0.5,
      unit: "A",
      outcome: "Le courant vaut 4 A.",
    },
  },
  {
    text: "Classe les grandeurs.",
    action: "",
    support: {
      kind: "classify",
      categories: ["Entrée", "Sortie"],
      cases: [
        { label: "Tension", category_index: 0 },
        { label: "Courant", category_index: 1 },
      ],
    },
  },
  {
    text: "Complète le tableau.",
    action: "",
    support: { kind: "fill_table", table: rawTable, blanks: [{ row: 0, col: 2 }], distractors: ["9 A"] },
  },
];

export const rawVocabulary = [
  { term: "Tension", plain: "Ce qui pousse le courant.", formula_latex: "U = R I" },
  { term: "Courant", plain: "Le débit de charges." },
];

export const rawTrapsCards = { mode: "cards", entries: [{ claim: "Plus de R, plus de I", explanation: "Tentant car R grandit." }] };

export const rawTrapsSpot = {
  mode: "spot",
  entries: [{ statements: ["U = R I", "I = R U", "R = U / I"], wrong_index: 1, explanation: "On confond les rôles." }],
};

export const rawTrapsRewrite = {
  mode: "spot_rewrite",
  entries: [
    {
      statements: ["U = R I", "I = R U"],
      wrong_index: 1,
      rewrite_options: ["I = U / R", "I = R / U"],
      correct_rewrite_index: 0,
      explanation: "On inverse le rapport.",
    },
  ],
};

export const rawTrialQcm = {
  kind: "qcm",
  questions: [
    { kind: "choice", question: "Quelle unité pour R ?", options: ["Ω", "A", "V"], correct_option_indices: [0], explanation: "L'ohm." },
    { kind: "numeric", question: "I pour 12 V et 4 Ω ?", options: [], expected_value: 3, unit: "A", explanation: "12 / 4." },
  ],
};

export const rawTrialCard = {
  kind: "exercise_card",
  card: { statement: "Calcule I pour 9 V et 3 Ω.", hint: "Utilise U = R I.", steps: ["I = U / R", "I = 9 / 3"], result: "3 A" },
};

export const rawCycle = {
  thread: "De la tension au courant.",
  challenge: rawChallenge,
  steps: rawSteps,
  vocabulary: rawVocabulary,
  traps: rawTrapsSpot,
  trial: rawTrialQcm,
  minutes_min: 4,
  minutes_max: 6,
};

export const rawSection = (cycle: unknown) => ({
  id: "s1",
  title: "La loi d'Ohm",
  key_takeaways: ["U = R I"],
  cycle,
});

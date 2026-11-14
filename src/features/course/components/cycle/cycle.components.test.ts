import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { courseSectionSchema } from "../../course.schema";
import type { CourseSection } from "../../course.types";
import {
  rawCycle,
  rawSection,
  rawSteps,
  rawTrapsCards,
  rawTrapsRewrite,
  rawTrapsSpot,
  rawTrialCard,
} from "../../cycle.fixtures";
import type { CycleProgress } from "../../cycleProgress";
import { EMPTY_PROGRESS, type SectionProgress } from "../../sectionProgress";
import { SectionsList } from "../SectionsList";
import { ClassifyAction } from "./ClassifyAction";
import { CycleChallenge } from "./CycleChallenge";
import { CycleReader } from "./CycleReader";
import { CycleTraps } from "./CycleTraps";
import { CycleTrial } from "./CycleTrial";
import { CycleVocabulary } from "./CycleVocabulary";
import { FillTableAction } from "./FillTableAction";
import { MatchAction } from "./MatchAction";
import { OrderAction } from "./OrderAction";

// LatexText remplit le DOM dans un effet (absent du rendu serveur) : rendu texte React, qui échappe tout HTML.
vi.mock("@/shared/utils/latex", () => ({
  LatexText: ({ text }: { text: string }) => createElement("span", null, text),
}));

const noop = () => {};
const html = (node: ReactElement) =>
  renderToStaticMarkup(createElement(QueryClientProvider, { client: new QueryClient() }, node));
const parse = (cycle: unknown) => courseSectionSchema.parse(rawSection(cycle)) as CourseSection & { cycle: NonNullable<CourseSection["cycle"]> };
const get = (answers: Record<string, object> = {}) => (id: string) => answers[id];

function reader(section = parse(rawCycle), progress: SectionProgress = EMPTY_PROGRESS, cycleProgress: CycleProgress = {}) {
  return html(
    createElement(CycleReader, {
      section,
      index: 0,
      progressKey: "s1",
      headingId: "h",
      progress,
      update: noop,
      cycleProgress,
      updateCycle: noop,
      onOverride: noop,
    }),
  );
}

describe("CycleReader — déroulé", () => {
  it("début : seul le Défi est visible, titres fixes, durée et fil rouge affichés", () => {
    const out = reader();
    expect(out).toContain("Défi");
    expect(out).toContain("Temps 1 sur 5");
    expect(out).toContain("4–6 min");
    expect(out).toContain("De la tension au courant.");
    expect(out).not.toContain("Sous le capot");
    expect(out).not.toContain("Épreuve");
    expect(out).not.toMatch(/Pourquoi|Quoi |Comment/);
    expect(out).not.toContain("Continuer"); // défi non validé : pas de suite
    expect(out).not.toContain("Terminer la section");
  });

  it("stepper à N segments réels : un seul temps courant, aucun titre à venir", () => {
    const start = reader();
    expect(start.match(/aria-current="step"/g)).toHaveLength(1);
    expect(start.match(/Étape \d sur 5 :/g)).toHaveLength(5);
    expect(start).toContain("Temps 1 sur 5 · Défi");

    const short = reader(parse({ ...rawCycle, vocabulary: [], traps: undefined }), { unlocked: [], done: [], revealed: { s1: 2 } });
    expect(short.match(/Étape \d sur 3 :/g)).toHaveLength(3);

    const finished = reader(parse(rawCycle), { unlocked: ["s1"], done: ["s1"] });
    expect(finished).not.toContain("aria-current");
    expect(finished.match(/: terminée/g)).toHaveLength(5);
  });

  it("défi : cases à cocher, nombre de bonnes réponses jamais annoncé", () => {
    const out = reader();
    expect(out.match(/type="checkbox"/g)).toHaveLength(4);
    expect(out).not.toMatch(/plusieurs réponses|une seule réponse|\d+ bonnes?/i);
  });

  it("défi validé : correction en une ligne et « Continuer » vers Sous le capot", () => {
    const out = reader(parse(rawCycle), EMPTY_PROGRESS, { s1: { answers: { challenge: { picked: [0], correct: true } } } });
    expect(out).toContain("Avec R constante, I = U / R double bien.");
    expect(out).toContain("Continuer");
    expect(out).toContain("vers Sous le capot");
  });

  it("temps absents sautés : sans vocabulaire ni pièges, le Défi mène à Sous le capot puis à l'Épreuve", () => {
    const section = parse({ ...rawCycle, vocabulary: [], traps: undefined });
    const out = reader(section, { unlocked: [], done: [], revealed: { s1: 3 } });
    expect(out).toContain("Temps 3 sur 3");
    expect(out).toContain("Épreuve");
    expect(out).not.toContain("Le mot juste");
    expect(out).not.toContain("Les pièges classiques");
  });

  it("section terminée : cinq temps, encadré « retenir », aucun titre Pourquoi / Quoi / Comment", () => {
    const out = reader(parse(rawCycle), { unlocked: ["s1"], done: ["s1"] });
    for (const title of ["Défi", "Sous le capot", "Le mot juste", "Les pièges classiques", "Épreuve"]) {
      expect(out).toContain(title);
    }
    expect(out).toContain("Terminée");
    expect(out).toContain("Ce qu&#x27;il faut retenir");
    expect(out).not.toMatch(/>Pourquoi|>Quoi|>Comment/);
  });

  it("dernier temps dévoilé non terminé : bouton « Terminer la section »", () => {
    const out = reader(parse(rawCycle), { unlocked: ["s1"], done: [], revealed: { s1: 5 } });
    expect(out).toContain("Terminer la section");
    expect(out).not.toContain("Ce qu&#x27;il faut retenir");
  });

  it("texte du cours jamais interprété en HTML", () => {
    const evil = parse({
      ...rawCycle,
      challenge: { ...rawCycle.challenge, question: "<img src=x onerror=alert(1)> Q", options: ["<script>x</script>", "b"], correct_indices: [1] },
    });
    const out = reader(evil);
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<script");
    expect(out).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});

describe("Sous le capot", () => {
  const atSteps = { unlocked: ["s1"], done: [], revealed: { s1: 2 } };

  it("la prédiction précède le support : tableau masqué tant qu'elle n'est pas faite", () => {
    const out = reader(parse(rawCycle), atSteps);
    expect(out).toContain("Étape 1 sur 3");
    expect(out).toContain("Quel courant pour 20 V ?");
    expect(out).not.toContain("Loi d&#x27;Ohm");
    expect(out).not.toContain("Étape suivante");
    expect(out).not.toContain("Étape 2 sur 3");
  });

  it("prédiction fausse : retour qui compare à outcome, support visible, sans note", () => {
    const out = reader(parse(rawCycle), atSteps, { s1: { answers: { "step-0-prediction": { value: 9 } } } });
    expect(out).toContain("Pas tout à fait");
    expect(out).toContain("Le courant vaut 4 A.");
    expect(out).toContain("Loi d&#x27;Ohm");
    expect(out).toContain("Étape suivante");
    expect(out).not.toMatch(/\d+ ?\/ ?\d+ points|score|note/i);
  });

  it("« je ne sais pas » : le retour s'affiche et la progression continue", () => {
    const out = reader(parse(rawCycle), atSteps, { s1: { answers: { "step-0-prediction": { skipped: true } } } });
    expect(out).toContain("Pas de souci");
    expect(out).toContain("Le courant vaut 4 A.");
    expect(out).toContain("Étape suivante");
  });

  it("reprise : mini-étapes déjà dévoilées conservées", () => {
    const out = reader(parse(rawCycle), atSteps, { s1: { steps: 2, answers: { "step-0-prediction": { skipped: true } } } });
    expect(out).toContain("Étape 2 sur 3");
    expect(out).toContain("Classe les grandeurs.");
  });

  it("étape sans support ni prédiction reste lisible", () => {
    const out = reader(parse({ ...rawCycle, steps: [{ text: "Seulement du texte." }] }), atSteps);
    expect(out).toContain("Seulement du texte.");
  });

  it("widget de l'étape : remplace l'action de reconstruction (le widget est servi en iframe sandbox)", () => {
    const withWidget = parse({
      ...rawCycle,
      steps: [{ ...rawSteps[1], widget: { title: "Sim", description: "Une simulation", html: "<div>ok</div>" } }],
    });
    const out = reader(withWidget, atSteps);
    expect(out).not.toContain("Classe chaque cas");
    expect(out).toContain("sandbox");
  });
});

describe("actions de reconstruction (rendu statique)", () => {
  const steps = parse(rawCycle).cycle.steps;
  const support = (kind: string) => steps.map((s) => s.support).find((s) => s?.kind === kind);

  it("classement : un groupe radio par cas, vérifier / solution", () => {
    const s = support("classify");
    const out = html(createElement(ClassifyAction, { support: s as never, onAnswer: noop }));
    expect(out.match(/type="radio"/g)).toHaveLength(4);
    expect(out).toContain("Vérifier");
    expect(out).toContain("Voir la solution");
  });

  it("ordre : boutons Monter / Descendre au clavier, premier « Monter » désactivé", () => {
    const out = html(
      createElement(OrderAction, {
        support: { kind: "order", caption: "", order_items: ["A", "B", "C"], order_criterion: "du plus petit" },
        onAnswer: noop,
      }),
    );
    expect(out.match(/Monter «/g)).toHaveLength(3);
    expect(out.match(/Descendre «/g)).toHaveLength(3);
    expect(out).toContain("du plus petit");
    expect(out).toMatch(/disabled=""[^>]*><span aria-hidden="true">↑/);
  });

  it("association : une liste déroulante native par ligne", () => {
    const out = html(
      createElement(MatchAction, {
        support: { kind: "match", caption: "", match_pairs: [{ left: "a", right: "1" }, { left: "b", right: "2" }] },
        onAnswer: noop,
      }),
    );
    expect(out.match(/<select/g)).toHaveLength(2);
  });

  it("tableau à compléter : case masquée en liste déroulante, tableau en défilement horizontal contenu", () => {
    const s = support("fill_table");
    const out = html(createElement(FillTableAction, { support: s as never, onAnswer: noop }));
    expect(out).toContain("overflow-x-auto");
    expect(out.match(/<select/g)).toHaveLength(1);
    expect(out).toContain("Case à compléter");
    expect(out).not.toContain("<span>2 A</span>"); // la cellule masquée n'est pas affichée en clair (elle n'est que parmi les choix)
  });

  it("reprise : action déjà résolue affichée verrouillée, sans boutons de vérification", () => {
    const out = html(
      createElement(OrderAction, {
        support: { kind: "order", caption: "", order_items: ["A", "B"], order_criterion: "" },
        answer: { correct: true },
        onAnswer: noop,
      }),
    );
    expect(out).toContain("Bien joué");
    expect(out).not.toContain("Vérifier");
    expect(out).not.toContain("Monter");
  });
});

describe("Le mot juste et Les pièges classiques", () => {
  it("vocabulaire : tableau Terme / En clair, formule présente seulement si fournie", () => {
    const out = html(createElement(CycleVocabulary, { terms: parse(rawCycle).cycle.vocabulary }));
    expect(out).toContain("Terme");
    expect(out).toContain("En clair");
    expect(out).toContain("U = R I");
    expect(out).toContain("overflow-x-auto");
    expect(out.match(/<tr/g)).toHaveLength(3);
  });

  const traps = (raw: unknown, answers: Record<string, object> = {}) =>
    html(createElement(CycleTraps, { traps: parse({ ...rawCycle, traps: raw }).cycle.traps as never, getAnswer: get(answers), onAnswer: noop }));

  it("cards : explication masquée puis révélée au clic (jamais au survol)", () => {
    const closed = traps(rawTrapsCards);
    expect(closed).toContain("Plus de R, plus de I");
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).not.toContain("Tentant car R grandit.");
    const open = traps(rawTrapsCards, { "trap-0-card": { picked: [] } });
    expect(open).toContain("Tentant car R grandit.");
    expect(open).toContain("Pourquoi c&#x27;est tentant");
  });

  it("spot : affirmations au choix, explication après validation", () => {
    const before = traps(rawTrapsSpot);
    expect(before).toContain("Laquelle de ces affirmations est fausse");
    expect(before).not.toContain("On confond les rôles.");
    const after = traps(rawTrapsSpot, { "trap-0-spot": { picked: [0], correct: false } });
    expect(after).toContain("On confond les rôles.");
    expect(after).toContain("Ce n&#x27;est pas celle-ci");
  });

  it("spot_rewrite : la reformulation n'apparaît qu'une fois l'affirmation repérée, l'explication à la fin", () => {
    const first = traps(rawTrapsRewrite);
    expect(first).not.toContain("Quelle est la bonne reformulation");
    const second = traps(rawTrapsRewrite, { "trap-0-spot": { picked: [1], correct: true } });
    expect(second).toContain("Quelle est la bonne reformulation");
    expect(second).not.toContain("On inverse le rapport.");
    const done = traps(rawTrapsRewrite, { "trap-0-spot": { picked: [1] }, "trap-0-rewrite": { picked: [0] } });
    expect(done).toContain("On inverse le rapport.");
  });
});

describe("Défi et Épreuve", () => {
  it("défi sans réponse : validation explicite désactivée, « je ne sais pas » proposé", () => {
    const out = html(createElement(CycleChallenge, { challenge: parse(rawCycle).cycle.challenge, onAnswer: noop }));
    expect(out).toContain("Valider ma réponse");
    expect(out).toContain("Je ne sais pas");
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>Valider ma réponse/);
  });

  it("défi « je ne sais pas » : correction affichée, aucune marque par option", () => {
    const out = html(createElement(CycleChallenge, { challenge: parse(rawCycle).cycle.challenge, answer: { skipped: true }, onAnswer: noop }));
    expect(out).toContain("Avec R constante");
    expect(out).not.toContain("bonne réponse");
  });

  it("épreuve QCM : choix et numérique, retour sans note après validation", () => {
    const trial = parse(rawCycle).cycle.trial as never;
    const before = html(createElement(CycleTrial, { trial, getAnswer: get(), onAnswer: noop }));
    expect(before.match(/Valider/g)).toHaveLength(2);
    expect(before).toContain("Ta réponse"); // champ numérique du quiz réutilisé
    expect(before.match(/<button[^>]*disabled=""[^>]*>Valider/g)).toHaveLength(2); // rien de saisi : pas de validation
    expect(before.match(/type="radio"/g)).toHaveLength(3); // une seule bonne réponse : boutons radio
    const after = html(
      createElement(CycleTrial, {
        trial,
        getAnswer: get({ "trial-0": { picked: [1] }, "trial-1": { value: 2 } }),
        onAnswer: noop,
      }),
    );
    expect(after).toContain("Pas tout à fait");
    expect(after).toContain("L&#x27;ohm.");
    expect(after).toContain("Réponse attendue : 3 A");
    expect(after).not.toMatch(/score|\/ ?20|points/i);
  });

  it("épreuve exercise_card : indice sur demande, correction masquée puis pas à pas", () => {
    const trial = parse({ ...rawCycle, trial: rawTrialCard }).cycle.trial as never;
    const before = html(createElement(CycleTrial, { trial, getAnswer: get(), onAnswer: noop }));
    expect(before).toContain("Calcule I pour 9 V et 3 Ω.");
    expect(before).toContain("Indice suivant");
    expect(before).not.toContain("I = U / R");
    const after = html(createElement(CycleTrial, { trial, getAnswer: get({ "trial-card": { picked: [] } }), onAnswer: noop }));
    expect(after).toContain("Correction pas à pas");
    expect(after).toContain("I = 9 / 3");
    expect(after).toContain("3 A");
  });
});

describe("SectionsList — choix du lecteur et non-régression", () => {
  const legacy: CourseSection = { id: "old", title: "Ancienne section", quoi: "Quoi legacy", pourquoi: "Pourquoi legacy", comment: "Comment legacy" };
  const list = (sections: CourseSection[]) =>
    html(createElement(SectionsList, { sections, courseKey: "test-course", sessionId: null }));

  it("ancien cours : SectionReader inchangé, aucun cycle ni durée", () => {
    const out = list([legacy]);
    expect(out).toContain("Ancienne section");
    expect(out).toContain("Quoi legacy");
    expect(out).not.toContain("Temps 1 sur");
    expect(out).not.toMatch(/\d+ min/);
  });

  it("section avec cycle : CycleReader et durée dans la navigation", () => {
    const out = list([parse(rawCycle), legacy]);
    expect(out).toContain("Temps 1 sur 5");
    expect(out).toContain("(durée estimée 4–6 min)");
    expect(out).toContain("Ancienne section"); // l'ancienne section reste listée, sans durée
  });

  it("cycle invalide : la section retombe sur le lecteur historique", () => {
    const broken = courseSectionSchema.parse({ ...rawSection({ steps: [] }), quoi: "Contenu de repli" }) as CourseSection;
    const out = list([broken]);
    expect(out).toContain("Contenu de repli");
    expect(out).not.toContain("Temps 1 sur");
  });

  it("section incomplète avec cycle : garde le lecteur historique (régénération possible)", () => {
    const incomplete = { ...parse(rawCycle), incomplete: true };
    expect(list([incomplete])).not.toContain("Temps 1 sur");
  });
});

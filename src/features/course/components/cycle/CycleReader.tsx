"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Stepper } from "@/components/Stepper";
import { sectionAnchorId } from "@/features/exercises/exerciseLinks";
import { LatexText } from "@/shared/utils/latex";
import type { CourseSection, CourseVideo, SectionCycle } from "../../course.types";
import { cycleDurationLabel } from "../../cycleDuration";
import { CYCLE_STAGE_TITLES, cycleStages, stageProgressLabel, stageView, type CycleStageKey } from "../../cycleFormat";
import {
  getAnswer,
  recordAnswer,
  revealedMiniSteps,
  revealNextMiniStep,
  type CycleAnswerRecord,
  type CycleProgress,
  answerKey,
} from "../../cycleProgress";
import { completeSection, revealedStepCount, revealNextStep, type SectionProgress } from "../../sectionProgress";
import { SectionNoteButton } from "../learning/SectionNoteButton";
import { focusAfterRender } from "../SectionReader";
import { SectionTakeaways } from "../SectionTakeaways";
import { SectionVideos } from "../SectionVideos";
import { CycleChallenge } from "./CycleChallenge";
import { CycleStepView } from "./CycleStepView";
import { CycleTrial } from "./CycleTrial";
import { CycleTraps } from "./CycleTraps";
import { CycleVocabulary } from "./CycleVocabulary";
import { StageHeading } from "./cycleUi";

interface CycleReaderProps {
  /** Section portant un `cycle` (le parent choisit ce lecteur via `hasCycle`). */
  section: CourseSection & { cycle: SectionCycle };
  /** Position 0-based dans le cours. */
  index: number;
  progressKey: string;
  headingId: string;
  sessionId?: string | null;
  /** Temps dévoilés et fin de section : même état que le lecteur historique (la navigation le lit). */
  progress: SectionProgress;
  update: (transition: (current: SectionProgress) => SectionProgress) => void;
  /** Mini-étapes dévoilées et réponses données. */
  cycleProgress: CycleProgress;
  updateCycle: (transition: (current: CycleProgress) => CycleProgress) => void;
  onOverride: (patch: Partial<CourseSection>) => void;
  videos?: CourseVideo[];
  onVideoNoteSaved?: (videoId: string, note: string) => void;
  onDoExercise?: () => void;
}

/**
 * Section au format « cycle » : Défi → Sous le capot → Le mot juste → Les pièges classiques → Épreuve,
 * chaque temps (absent = sauté) se dévoilant quand le précédent est franchi. Rien n'est noté, aucun
 * verrou dur : chaque interaction a une sortie (« je ne sais pas », « voir la solution »).
 * Tous les textes sont rendus sans HTML.
 */
export function CycleReader({
  section,
  index,
  progressKey: id,
  headingId,
  sessionId,
  progress,
  update,
  cycleProgress,
  updateCycle,
  onOverride,
  videos = [],
  onVideoNoteSaved = () => {},
  onDoExercise,
}: CycleReaderProps) {
  const { cycle } = section;
  const stages = cycleStages(section);
  const total = stages.length;
  const revealed = revealedStepCount(progress, id, total);
  const done = progress.done.includes(id);
  const domPrefix = `section-${index}`;
  const stageDomId = (key: CycleStageKey) => `${domPrefix}-cycle-${key}`;
  const stepsIndex = stages.indexOf("steps");
  const stepsFullyShown = done || revealed - 1 > stepsIndex;
  const stepCount = revealedMiniSteps(cycleProgress, id, cycle.steps.length, stepsFullyShown);
  const duration = cycleDurationLabel(section);
  // Temps dévoilé par un clic sur « Continuer » : seul celui-là entre en fondu (jamais à la reprise).
  const [entering, setEntering] = useState<CycleStageKey | null>(null);

  const answerOf = (answer: string) => getAnswer(cycleProgress, id, answer);
  const answer = (answerId: string, record: CycleAnswerRecord) => updateCycle((p) => recordAnswer(p, id, answerId, record));

  const goToNextStage = () => {
    setEntering(stages[revealed]);
    update((p) => revealNextStep(p, id, total));
    focusAfterRender(`${stageDomId(stages[revealed])}-title`);
  };
  const nextMiniStep = () => {
    updateCycle((p) => revealNextMiniStep(p, id, cycle.steps.length));
    focusAfterRender(`${domPrefix}-cycle-step-${stepCount}`);
  };

  const content = (key: CycleStageKey) => {
    switch (key) {
      case "challenge":
        return <CycleChallenge challenge={cycle.challenge} answer={answerOf(answerKey.challenge)} onAnswer={(r) => answer(answerKey.challenge, r)} />;
      case "steps":
        return (
          <ol className="space-y-5">
            {cycle.steps.slice(0, stepCount).map((step, i) => (
              <li key={i}>
                <CycleStepView
                  step={step}
                  index={i}
                  total={cycle.steps.length}
                  headingId={`${domPrefix}-cycle-step-${i}`}
                  getAnswer={answerOf}
                  onAnswer={answer}
                />
              </li>
            ))}
          </ol>
        );
      case "vocabulary":
        return <CycleVocabulary terms={cycle.vocabulary} />;
      case "traps":
        return cycle.traps ? <CycleTraps traps={cycle.traps} getAnswer={answerOf} onAnswer={answer} /> : null;
      case "trial":
        return cycle.trial ? <CycleTrial trial={cycle.trial} getAnswer={answerOf} onAnswer={answer} /> : null;
    }
  };

  /** Bouton qui suit le dernier temps dévoilé ; null tant que le temps n'est pas franchi. */
  const advance = (key: CycleStageKey, position: number) => {
    if (position !== revealed - 1 || done) return null;
    const isLast = position === total - 1;
    if (key === "challenge" && !answerOf(answerKey.challenge)) return null;
    // Pas de suite tant que la prédiction de la dernière mini-étape n'est ni faite ni passée.
    const current = cycle.steps[stepCount - 1];
    if (key === "steps" && current?.prediction && !answerOf(answerKey.prediction(stepCount - 1))) return null;
    if (key === "steps" && stepCount < cycle.steps.length) {
      return <Button type="button" className="w-full sm:w-auto" onClick={nextMiniStep}>Étape suivante</Button>;
    }
    return isLast ? (
      <Button type="button" variant="accent" className="w-full sm:w-auto" onClick={() => update((p) => completeSection(p, id))}>
        Terminer la section
      </Button>
    ) : (
      <Button type="button" className="w-full sm:w-auto" onClick={goToNextStage}>
        Continuer
        <span className="sr-only"> vers {CYCLE_STAGE_TITLES[stages[position + 1]]}</span>
      </Button>
    );
  };

  return (
    <Card id={section.id ? sectionAnchorId(section.id) : undefined} className="p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} tabIndex={-1} className="font-serif text-xl font-semibold leading-snug text-ink">
          <span className="mr-2 text-primary">{index + 1}.</span>
          <LatexText text={section.title.replace(/^\d+\.\s*/, "")} />
        </h3>
        <div className="flex items-center gap-2">
          {done && <Badge variant="ok">Terminée</Badge>}
          {sessionId && section.id && (
            <SectionNoteButton
              sessionId={sessionId}
              sectionId={section.id}
              sectionTitle={section.title}
              initialNote={section.note}
              onSaved={(note) => onOverride({ note })}
            />
          )}
        </div>
      </div>
      {cycle.thread && (
        <p className="mb-4 font-serif text-base italic leading-snug text-ink-2">
          <LatexText text={cycle.thread} />
        </p>
      )}
      <Stepper total={total} current={revealed} complete={done} label="Progression de la section" className="mb-3" />
      <p className="kicker mb-4">
        {stageProgressLabel(revealed, total, stages[revealed - 1])}
        {duration ? ` · ${duration}` : ""}
      </p>
      <ol className="space-y-5">
        {stages.slice(0, revealed).map((key, position) => {
          const current = stageView(position, revealed, done) === "current";
          const next = advance(key, position);
          return (
            <li
              key={key}
              id={stageDomId(key)}
              className={`${
                current
                  ? "rounded-card border border-line bg-surface p-3 shadow-paper sm:p-5"
                  : "border-l-2 border-primary pl-3 sm:pl-4"
              } ${entering === key ? "stage-in" : ""}`}
            >
              <StageHeading id={`${stageDomId(key)}-title`} done={!current}>
                {CYCLE_STAGE_TITLES[key]}
              </StageHeading>
              {content(key)}
              {next && <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">{next}</div>}
            </li>
          );
        })}
      </ol>
      {done && (
        <>
          <SectionTakeaways section={{ key_takeaways: section.key_takeaways }} idPrefix={`${domPrefix}-takeaways`} />
          <SectionVideos videos={videos} sessionId={sessionId} onNoteSaved={onVideoNoteSaved} />
          {onDoExercise && (
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="secondary" onClick={onDoExercise}>
                Faire l&apos;exercice
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

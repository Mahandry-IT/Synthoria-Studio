"use client";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { sectionAnchorId } from "@/features/exercises/exerciseLinks";
import { LatexText } from "@/shared/utils/latex";
import type { CourseSection, CourseVideo, SectionCycle } from "../../course.types";
import { cycleDurationLabel } from "../../cycleDuration";
import { CYCLE_STAGE_TITLES, cycleStages, type CycleStageKey } from "../../cycleFormat";
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
import { StageHeading, TOUCH_TARGET } from "./cycleUi";

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

  const answerOf = (answer: string) => getAnswer(cycleProgress, id, answer);
  const answer = (answerId: string, record: CycleAnswerRecord) => updateCycle((p) => recordAnswer(p, id, answerId, record));

  const goToNextStage = () => {
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
      return <Button type="button" className={TOUCH_TARGET} onClick={nextMiniStep}>Étape suivante</Button>;
    }
    return isLast ? (
      <Button type="button" className={TOUCH_TARGET} onClick={() => update((p) => completeSection(p, id))}>
        Terminer la section
      </Button>
    ) : (
      <Button type="button" className={TOUCH_TARGET} onClick={goToNextStage}>
        Continuer
        <span className="sr-only"> vers {CYCLE_STAGE_TITLES[stages[position + 1]]}</span>
      </Button>
    );
  };

  return (
    <Card id={section.id ? sectionAnchorId(section.id) : undefined} className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} tabIndex={-1} className="text-base font-semibold text-indigo-600 focus:outline-none">
          <span className="mr-2">{index + 1}.</span>
          <LatexText text={section.title.replace(/^\d+\.\s*/, "")} />
        </h3>
        <div className="flex items-center gap-2">
          {done && <Badge variant="green">Terminée</Badge>}
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
        <p className="mb-2 text-sm italic text-gray-600">
          <LatexText text={cycle.thread} />
        </p>
      )}
      <p className="mb-3 text-xs text-gray-500" aria-live="polite">
        Temps {revealed} sur {total}
        {duration ? ` · ${duration}` : ""}
      </p>
      <ol className="space-y-4">
        {stages.slice(0, revealed).map((key, position) => (
          <li key={key} id={stageDomId(key)} className="rounded-lg border border-gray-100 p-3">
            <StageHeading id={`${stageDomId(key)}-title`}>{CYCLE_STAGE_TITLES[key]}</StageHeading>
            {content(key)}
            <div className="mt-3">{advance(key, position)}</div>
          </li>
        ))}
      </ol>
      {done && (
        <>
          <SectionTakeaways section={{ key_takeaways: section.key_takeaways }} idPrefix={`${domPrefix}-takeaways`} />
          <SectionVideos videos={videos} sessionId={sessionId} onNoteSaved={onVideoNoteSaved} />
          {onDoExercise && (
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="outline" className={TOUCH_TARGET} onClick={onDoExercise}>
                Faire l&apos;exercice
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

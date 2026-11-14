"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LatexText } from "@/shared/utils/latex";
import { AnswerBlock } from "./AnswerBlock";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { ChallengeCard } from "./learning/ChallengeCard";
import { FadedExample } from "./learning/FadedExample";
import { RecallBox } from "./learning/RecallBox";
import { RegenerateSectionButton } from "./learning/RegenerateSectionButton";
import { SectionCheck } from "./learning/SectionCheck";
import { SectionNoteButton } from "./learning/SectionNoteButton";
import { SectionTakeaways } from "./SectionTakeaways";
import { SectionVideos } from "./SectionVideos";
import {
  buildLearningSteps,
  completeSection,
  fadedRevealedCount,
  isExplanationVisible,
  isProgressive,
  revealedStepCount,
  revealFadedStep,
  revealNextStep,
  type LearningStep,
  type LearningStepKind,
  type SectionProgress,
} from "../sectionProgress";
import { sectionAnchorId } from "@/features/exercises/exerciseLinks";
import type { CourseSection, CourseVideo } from "../course.types";

const STEP_LABELS: Record<LearningStepKind, string> = {
  challenge: "Défi",
  pourquoi: "Pourquoi",
  quoi: "Quoi",
  comment: "Comment",
  generic: "Étape",
  a_toi: "À toi",
  verifie: "Vérifie",
  explique: "Explique avec tes mots",
};

interface SectionReaderProps {
  section: CourseSection;
  /** Position 0-based dans le cours (numérotation et ids DOM). */
  index: number;
  /** Clé de progression de la section. */
  progressKey: string;
  /** Id DOM du titre de la section (cible du focus lors de la navigation). */
  headingId: string;
  sessionId?: string | null;
  progress: SectionProgress;
  update: (transition: (current: SectionProgress) => SectionProgress) => void;
  /** Section régénérée ou note enregistrée : appliquées en local par le parent. */
  onOverride: (patch: Partial<CourseSection>) => void;
  /** Vidéos rattachées à cette section, affichées sous son titre. */
  videos?: CourseVideo[];
  onVideoNoteSaved?: (videoId: string, note: string) => void;
  /** Régénération groupée en cours : le bouton de régénération de la section est désactivé. */
  regenerationLocked?: boolean;
  /** Fourni seulement si un exercice rédigé existe pour cette section et que la liste est prête (RG-7). */
  onDoExercise?: () => void;
}

/** Contenu explicatif complet : blocs typés si présents, sinon rendu legacy quoi/pourquoi/comment. */
function SectionExplanation({ section }: { section: CourseSection }) {
  const subsections = (section.subsections ?? []).filter((s) => s.blocks.length > 0);
  const hasContent =
    section.quoi || section.pourquoi || section.comment ||
    section.worked_example?.steps?.length || section.key_points?.length || section.tables?.length;

  if (subsections.length > 0) {
    return (
      <div className="space-y-4">
        {subsections.map((sub, j) => (
          <div key={j}>
            {sub.title && <h4 className="mb-1 font-serif text-base font-semibold text-ink">{sub.title}</h4>}
            <BlockRenderer blocks={sub.blocks} />
          </div>
        ))}
        {section.key_points && section.key_points.length > 0 && (
          <AnswerBlock answer={{ key_points: section.key_points }} />
        )}
      </div>
    );
  }
  if (hasContent) {
    return (
      <AnswerBlock
        answer={{
          quoi: section.quoi,
          pourquoi: section.pourquoi,
          comment: section.comment,
          worked_example: section.worked_example,
          key_points: section.key_points,
          tables: section.tables,
        }}
      />
    );
  }
  if (section.answer) return <AnswerBlock answer={section.answer} />;
  return <p className="text-sm italic text-ink-3">Pas de contenu disponible.</p>;
}

/** Titre affiché d'une étape : celui de la sous-section s'il existe, sinon le libellé du cycle. */
function stepTitle(step: LearningStep, section: CourseSection, position: number): string {
  if (step.subsectionIndex !== undefined) {
    const title = section.subsections?.[step.subsectionIndex]?.title?.trim();
    if (title) return title;
    if (step.kind === "generic") return `${STEP_LABELS.generic} ${position}`;
  }
  return STEP_LABELS[step.kind];
}

/** Déplace le focus sur un élément après le rendu (étape révélée, section ouverte). */
export function focusAfterRender(elementId: string) {
  requestAnimationFrame(() => {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/**
 * Une section du cours. Section avec défi et contenu par blocs : dévoilement progressif
 * (Défi → Pourquoi → Quoi → Comment → À toi → Vérifie → Explique), chaque étape se dépliant via
 * « Continuer » ; les étapes déjà vues restent repliables. Sections historiques : affichage complet.
 */
export function SectionReader({
  section,
  index,
  progressKey: id,
  headingId,
  sessionId,
  progress,
  update,
  onOverride,
  videos = [],
  onVideoNoteSaved = () => {},
  regenerationLocked = false,
  onDoExercise,
}: SectionReaderProps) {
  // Étapes repliées par l'apprenant (état d'affichage local, non persisté)
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const canRecall = Boolean(sessionId && section.id && section.recall_prompt);
  const done = progress.done.includes(id);
  const domPrefix = `section-${index}`;

  const header = (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} tabIndex={-1} className="font-serif text-xl font-semibold leading-snug text-ink">
          <span className="mr-2 text-primary">{index + 1}.</span>
          <LatexText text={section.title.replace(/^\d+\.\s*/, "")} />
        </h3>
        <div className="flex items-center gap-2">
          {done && <Badge variant="ok">Terminée</Badge>}
          {sessionId && section.id && !section.incomplete && (
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
    </>
  );
  // Vidéos de la section : en fin de section, après les encadrés ; rien sans vidéo.
  const videosBlock = (
    <SectionVideos videos={videos} sessionId={sessionId} onNoteSaved={onVideoNoteSaved} />
  );

  const fadedExample = section.faded_example;
  // Lien vers l'exercice corrigé : en fin de section, après les encadrés et les vidéos.
  const exerciseButton = onDoExercise ? (
    <div className="mt-4 flex justify-end">
      <Button type="button" variant="secondary" onClick={onDoExercise}>
        Faire l&apos;exercice
      </Button>
    </div>
  ) : null;
  // Cible de « Retour à la section » depuis l'exercice.
  const anchorId = section.id ? sectionAnchorId(section.id) : undefined;

  const hiddenCount = fadedExample?.hidden_steps?.length ?? 0;
  const renderFaded = (hideTitle: boolean) =>
    fadedExample ? (
      <FadedExample
        example={fadedExample}
        revealed={fadedRevealedCount(progress, id, hiddenCount)}
        onReveal={() => update((p) => revealFadedStep(p, id, hiddenCount))}
        hideTitle={hideTitle}
      />
    ) : null;

  if (section.incomplete) {
    return (
      <Card id={anchorId} className="p-4 sm:p-6">
        {header}
        {sessionId && section.id ? (
          <RegenerateSectionButton
            sessionId={sessionId}
            sectionId={section.id}
            onRegenerated={(regenerated) => onOverride(regenerated)}
            locked={regenerationLocked}
          />
        ) : (
          <SectionExplanation section={section} />
        )}
        {videosBlock}
      </Card>
    );
  }

  // ─── Sections historiques (sans défi ni sous-sections) : affichage complet, comme avant ───
  if (!isProgressive(section)) {
    const hasChallenge = Boolean(section.challenge);
    const visible = isExplanationVisible(progress, id, hasChallenge);
    // Encadrés et vidéos après le quiz : sans question, rien à spoiler ; sinon une fois terminée.
    const atEnd = visible && (done || (section.check_questions ?? []).length === 0);
    return (
      <Card id={anchorId} className="p-4 sm:p-6">
        {header}
        <div className="space-y-4">
          {hasChallenge && !visible && (
            <ChallengeCard
              challenge={section.challenge ?? ""}
              sessionId={sessionId}
              sectionId={section.id}
              onContinue={() => update((p) => revealNextStep(p, id, 2))}
            />
          )}
          {visible && (
            <>
              <SectionExplanation section={section} />
              {renderFaded(false)}
              <SectionCheck
                questions={section.check_questions ?? []}
                onComplete={() => update((p) => completeSection(p, id))}
              />
              {canRecall && section.id && section.recall_prompt && (
                <RecallBox sessionId={sessionId as string} sectionId={section.id} prompt={section.recall_prompt} />
              )}
              {atEnd && <SectionTakeaways section={section} idPrefix={`${domPrefix}-takeaways`} />}
            </>
          )}
        </div>
        {atEnd && videosBlock}
        {atEnd && exerciseButton}
      </Card>
    );
  }

  // ─── Dévoilement progressif ───
  const steps = buildLearningSteps(section, canRecall);
  const total = steps.length;
  const revealed = revealedStepCount(progress, id, total);
  const hasCheck = steps.some((s) => s.kind === "verifie");
  const atEnd = revealed >= total && done;
  const lastSubsectionStep = [...steps].reverse().find((s) => s.subsectionIndex !== undefined);
  const stepDomId = (step: LearningStep) => `${domPrefix}-${step.key}`;

  const continueTo = (nextIndex: number) => {
    update((p) => {
      const next = revealNextStep(p, id, total);
      // Sans « Vérifie », la section est terminée quand tout est dévoilé.
      return !hasCheck && nextIndex >= total - 1 ? completeSection(next, id) : next;
    });
    const nextStep = steps[nextIndex];
    if (nextStep) focusAfterRender(`${stepDomId(nextStep)}-title`);
  };

  const toggle = (key: string) =>
    setCollapsed((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));

  const renderStepContent = (step: LearningStep) => {
    switch (step.kind) {
      case "a_toi":
        return renderFaded(true);
      case "verifie":
        return (
          <SectionCheck
            questions={section.check_questions ?? []}
            onComplete={() => update((p) => completeSection(p, id))}
            hideTitle
          />
        );
      case "explique":
        return sessionId && section.id && section.recall_prompt ? (
          <RecallBox sessionId={sessionId} sectionId={section.id} prompt={section.recall_prompt} hideTitle />
        ) : null;
      default: {
        const sub = step.subsectionIndex !== undefined ? section.subsections?.[step.subsectionIndex] : undefined;
        return (
          <>
            {sub && <BlockRenderer blocks={sub.blocks} />}
            {step === lastSubsectionStep && section.key_points && section.key_points.length > 0 && (
              <div className="mt-4">
                <AnswerBlock answer={{ key_points: section.key_points }} />
              </div>
            )}
          </>
        );
      }
    }
  };

  return (
    <Card id={anchorId} className="p-4 sm:p-6">
      {header}
      <p className="kicker mb-4" aria-live="polite">
        Étape {revealed} sur {total}
      </p>
      <ol className="space-y-4">
        {steps.slice(0, revealed).map((step, i) => {
          const isLastRevealed = i === revealed - 1;
          const canContinue = isLastRevealed && revealed < total;

          if (step.kind === "challenge") {
            return (
              <li key={step.key} id={stepDomId(step)}>
                <h4 id={`${stepDomId(step)}-title`} tabIndex={-1} className="sr-only">
                  Défi
                </h4>
                <ChallengeCard
                  challenge={section.challenge ?? ""}
                  sessionId={sessionId}
                  sectionId={section.id}
                  answered={revealed > 1}
                  onContinue={() => continueTo(1)}
                />
              </li>
            );
          }

          const isCollapsed = collapsed.includes(step.key);
          const contentId = `${stepDomId(step)}-content`;
          return (
            <li key={step.key} id={stepDomId(step)} className="rounded-card border border-line p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <h4
                  id={`${stepDomId(step)}-title`}
                  tabIndex={-1}
                  className="font-serif text-lg font-semibold leading-snug text-ink"
                >
                  {stepTitle(step, section, i)}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  aria-expanded={!isCollapsed}
                  aria-controls={contentId}
                  onClick={() => toggle(step.key)}
                >
                  {isCollapsed ? "Déplier" : "Replier"}
                  <span className="sr-only"> l&apos;étape {stepTitle(step, section, i)}</span>
                </Button>
              </div>
              {/* `hidden` plutôt que démonter : les réponses en cours (Vérifie, Explique) sont conservées. */}
              <div id={contentId} hidden={isCollapsed} className="mt-2">
                {renderStepContent(step)}
              </div>
              {canContinue && (
                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" className="w-full sm:w-auto" onClick={() => continueTo(i + 1)}>
                    Continuer
                    <span className="sr-only"> : {stepTitle(steps[i + 1], section, i + 1)}</span>
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {/* Encadrés et vidéos : uniquement une fois la dernière étape terminée (pas de spoil du quiz). */}
      {atEnd && (
        <>
          <SectionTakeaways section={section} idPrefix={`${domPrefix}-takeaways`} />
          {videosBlock}
          {exerciseButton}
        </>
      )}
    </Card>
  );
}

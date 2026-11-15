"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CourseTabs } from "./CourseTabs";
import { chooseInitialTab, readStoredTab, storeTab, subscribeTab } from "../courseTabs";
import {
  availableSections,
  chooseInitialSection,
  hasCourseBlock,
  type CourseSectionId,
} from "../courseSections";
import { CourseIconNav, sectionPanelId, sectionTabId } from "./CourseIconNav";
import { CourseIntro, CourseQuestionPanel } from "./CoursePanels";
import { CourseMetaHeader } from "./CourseMetaHeader";
import { useSectionProgress } from "../hooks/useSectionProgress";
import { headingIdOf, SectionsList } from "./SectionsList";
import { focusAfterRender } from "./SectionReader";
import { PitfallsList } from "./PitfallsList";
import { QuizPanel } from "./QuizPanel";
import { useQuizFlow } from "../hooks/useQuizFlow";
import { useVideoNotes } from "../hooks/useVideoNotes";
import { splitVideosBySection } from "../videoGrouping";
import { isMissingWrapUp } from "../incompleteCourse";
import { SummaryBlock } from "./SummaryBlock";
import { NextStepsList } from "./NextStepsList";
import { VideoCards } from "./VideoCards";
import { AddCourseContentButton } from "./learning/AddCourseContentButton";
import { Badge } from "@/components/Badge";
import { SessionPodcast } from "@/features/podcast/components/SessionPodcast";
import { ExercisesPanel } from "@/features/exercises/components/ExercisesPanel";
import { isFreshCourse } from "@/features/exercises/exercise.state";
import { buildSectionExerciseMap } from "@/features/exercises/exerciseLinks";
import { useExercises } from "@/features/exercises/hooks/useExercises";
import { setCurrentSection } from "../sectionProgress";
import { ExercisesOffer } from "@/features/exercises/components/ExercisesOffer";
import { ChatLauncher } from "@/features/chat/components/ChatLauncher";
import type { AddCourseSectionsResponse, CourseGenerationResponse, CourseSection } from "../course.types";

interface CourseViewProps {
  data: CourseGenerationResponse;
  /**
   * Session persistée du cours : active le bloc « Écouter ce cours » (podcast).
   * Par défaut `data.session_id` ; l'historique la fournit explicitement.
   */
  sessionId?: string | null;
  /** Question posée, affichée dans le bloc « Question » ; sans elle, ce bloc ne montre que la réponse directe. */
  question?: string;
}

/**
 * Rendu complet d'un cours généré.
 * Réutilisé par la page Ask et la page historique détail.
 *
 * Un cours régénéré en entier remplace celui reçu du parent : le contenu est remonté (`key`) pour
 * repartir d'un état neuf — sections ajoutées, overrides et quiz de l'ancien cours n'ont plus cours.
 */
export function CourseView({ data, sessionId, question }: CourseViewProps) {
  const [regenerated, setRegenerated] = useState<{ course: CourseGenerationResponse; version: number } | null>(null);

  return (
    <CourseContent
      key={regenerated?.version ?? 0}
      data={regenerated?.course ?? data}
      sessionId={sessionId}
      question={question}
      onCourseRegenerated={(course) =>
        setRegenerated((current) => ({ course, version: (current?.version ?? 0) + 1 }))
      }
    />
  );
}

interface CourseContentProps extends CourseViewProps {
  onCourseRegenerated: (course: CourseGenerationResponse) => void;
}

function CourseContent({ data, sessionId: sessionIdProp, question, onCourseRegenerated }: CourseContentProps) {
  const sessionId = sessionIdProp ?? data.session_id ?? null;
  const isMode3 = data.mode === "question_only";
  const isMode2 = data.mode === "file_question";
  const quiz = data.quiz ?? [];
  const quizFlow = useQuizFlow(quiz, sessionId);
  // Section en cours de lecture (même clé de progression que SectionsList) : transmise au chat pour
  // cibler le contexte du tuteur. Les clés de repli (« #n », section sans id) ne sont pas envoyées.
  const { progress, update: updateProgress } = useSectionProgress(sessionId ?? data.meta?.title ?? "cours");
  const chatSectionId = progress.current && !progress.current.startsWith("#") ? progress.current : undefined;

  // Sections/next_steps ajoutées après coup (bouton « Ajouter du contenu ») : appliquées en local
  // par-dessus les données reçues, comme les overrides de SectionsList, sans dépendre d'un état
  // mutable détenu par le parent (page Ask ou historique).
  const [added, setAdded] = useState<{ sections: CourseSection[]; nextSteps: string[] | null }>({
    sections: [],
    nextSteps: null,
  });
  const sections = [...(data.sections ?? []), ...added.sections];
  const nextSteps = added.nextSteps ?? data.next_steps ?? [];

  // Vidéos rattachées à une section : affichées dans cette section ; les autres au niveau du cours.
  const { applyNotes, saveNote } = useVideoNotes();
  const videos = splitVideosBySection(
    applyNotes(data.videos ?? []),
    sections.flatMap((s) => (s.id ? [s.id] : [])),
  );

  function handleContentAdded(result: AddCourseSectionsResponse) {
    setAdded((current) => ({
      sections: [...current.sections, ...result.sections],
      nextSteps: result.next_steps,
    }));
  }

  // Onglet actif : « Leçons » au rendu serveur, puis l'onglet mémorisé une fois monté
  const hasQuiz = quiz.length > 0;
  const storedTab = useSyncExternalStore(subscribeTab, readStoredTab, () => null);
  const tab = chooseInitialTab(storedTab, hasQuiz);

  const sectionTitles = Object.fromEntries(sections.flatMap((s) => (s.id ? [[s.id, s.title]] : [])));

  // Exercices corrigés : table section → exercice (liste « done » seulement, RG-7) et exercice ouvert.
  // Seul observateur qui relève la liste (polling) : l'onglet et la fenêtre d'offre lisent le même cache.
  const exercisesQuery = useExercises(sessionId, { poll: true });
  const sectionExercises = useMemo(() => buildSectionExerciseMap(exercisesQuery.data), [exercisesQuery.data]);
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);

  function openExercise(exerciseId: string) {
    setOpenExerciseId(exerciseId);
    setChosenSection("course");
    storeTab("exercises");
  }

  // « Retour à la section » : l'exercice est refermé (l'onglet Exercices retrouve la liste), onglet Leçons,
  // section courante, puis focus et défilement vers son titre.
  function backToSection(sectionId: string) {
    setOpenExerciseId(null);
    updateProgress((p) => setCurrentSection(p, sectionId));
    setChosenSection("course");
    storeTab("lessons");
    const index = sections.findIndex((s) => s.id === sectionId);
    if (index >= 0) focusAfterRender(headingIdOf(index));
  }

  // La fenêtre « Générer les exercices ? » ne s'ouvre que sur un cours généré depuis moins d'1 h
  // (meta.generated_at) : pas sur tout l'historique. L'onglet garde le bouton de génération.
  const [mountedAt] = useState(() => Date.now());
  const isFresh = isFreshCourse(data.meta?.generated_at, mountedAt);

  const quizOnOwnPage = quizFlow.phase !== "intro";

  // Bloc actif : « Cours » au rendu serveur, puis le bloc mémorisé s'il a des données
  const pitfalls = data.common_pitfalls ?? [];
  const available = availableSections({
    hasQuestion: Boolean(question?.trim()),
    hasAnswer: Boolean(data.answer),
    hasPodcast: Boolean(sessionId),
    hasCourse: hasCourseBlock({ sectionCount: sections.length, hasQuiz, hasAnswer: Boolean(data.answer) }),
    hasPitfalls: pitfalls.length > 0,
    hasSummary: Boolean(data.summary),
    hasNextSteps: nextSteps.length > 0,
  });
  // Choix de l'utilisateur pour CE cours seulement (pas mémorisé d'un cours à l'autre)
  const [chosenSection, setChosenSection] = useState<CourseSectionId | null>(null);
  const section = chooseInitialSection(chosenSection, available);
  const has = (id: CourseSectionId) => available.some((s) => s.id === id);
  // Tous les blocs restent montés (masqués par `hidden`) : changer d'icône ne perd ni l'état des sections ni un suivi de génération
  const panelProps = (id: CourseSectionId) => ({
    role: "tabpanel" as const,
    id: sectionPanelId(id),
    "aria-labelledby": sectionTabId(id),
    hidden: section !== id,
    tabIndex: 0,
  });

  // Défilement remis en haut du bloc à chaque changement (pas au premier rendu)
  const panelRef = useRef<HTMLDivElement>(null);
  const previousSection = useRef(section);
  useEffect(() => {
    if (previousSection.current === section) return;
    previousSection.current = section;
    panelRef.current?.scrollIntoView({ block: "start" });
  }, [section]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [quizOnOwnPage]);

  // Le quiz démarré (ou terminé) occupe toute la page : impossible de revenir au cours
  // avant la fin ; les résultats ramènent au cours via « Retour au cours ».
  if (quizOnOwnPage) {
    return <QuizPanel questions={quiz} flow={quizFlow} />;
  }

  return (
    <div className="space-y-6">
      {(isMode3 || isMode2) && (
        <div className="flex items-center gap-2">
          {isMode3 && <Badge variant="info">🔍 Recherche web</Badge>}
          {isMode2 && <Badge variant="ok">📄 Basé sur vos documents</Badge>}
        </div>
      )}

      <CourseMetaHeader meta={data.meta} />

      {sessionId && hasQuiz && isFresh && <ExercisesOffer sessionId={sessionId} />}

      {/* Barre d'icônes (colonne à gauche ≥ lg, barre fixe en bas sinon) ; marge basse pour ne rien masquer */}
      <div className="pb-20 lg:flex lg:items-start lg:gap-6 lg:pb-0">
        <CourseIconNav sections={available} active={section} onChange={setChosenSection} />
        <div
          ref={panelRef}
          className="min-w-0 flex-1"
        >
          {has("question") && (
            <div {...panelProps("question")}>
              <CourseQuestionPanel question={question} answer={data.answer} />
            </div>
          )}
          {has("podcast") && sessionId && (
            <div {...panelProps("podcast")}>
              <SessionPodcast sessionId={sessionId} />
            </div>
          )}
          {has("course") && (
            <div {...panelProps("course")}>
            <div className="space-y-6">
              <VideoCards videos={videos.general} sessionId={sessionId} onNoteSaved={saveNote} />
              <CourseTabs
                active={tab}
                onChange={storeTab}
                panels={{
                  lessons: (
                    <div className="space-y-6">
                      <CourseIntro introduction={data.introduction} sources={data.sources} />

                      {sections.length > 0 && (
                        <SectionsList
                          sections={sections}
                          sessionId={sessionId}
                          courseKey={sessionId ?? data.meta?.title ?? "cours"}
                          videosBySection={videos.bySection}
                          onVideoNoteSaved={saveNote}
                          missingWrapUp={isMissingWrapUp(data)}
                          onCourseRegenerated={onCourseRegenerated}
                          sectionExercises={sectionExercises}
                          onDoExercise={openExercise}
                        />
                      )}

                      {sessionId && (
                        <div className="flex justify-center">
                          <AddCourseContentButton
                            sessionId={sessionId}
                            hasNextSteps={nextSteps.length > 0}
                            onAdded={handleContentAdded}
                          />
                        </div>
                      )}
                    </div>
                  ),
                  exercises: (
                    <ExercisesPanel
                      sessionId={sessionId}
                      sectionTitles={sectionTitles}
                      openExerciseId={openExerciseId}
                      onOpenExercise={setOpenExerciseId}
                      onBackToSection={backToSection}
                    />
                  ),
                  quiz: hasQuiz ? (
                    <QuizPanel questions={quiz} flow={quizFlow} />
                  ) : (
                    <p className="rounded-card border border-dashed border-line-2 p-6 text-center text-sm text-ink-3">
                      Ce cours n&apos;a pas de quiz.
                    </p>
                  ),
                }}
              />
            </div>
            </div>
          )}
          {has("pitfalls") && (
            <div {...panelProps("pitfalls")}>
              <PitfallsList pitfalls={pitfalls} />
            </div>
          )}
          {has("summary") && data.summary && (
            <div {...panelProps("summary")}>
              <SummaryBlock summary={data.summary} />
            </div>
          )}
          {has("next-steps") && (
            <div {...panelProps("next-steps")}>
              <NextStepsList steps={nextSteps} />
            </div>
          )}
        </div>
      </div>

      {/* Le quiz en page propre (retour anticipé plus haut) masque le chat */}
      {sessionId && <ChatLauncher sessionId={sessionId} sectionId={chatSectionId} />}
    </div>
  );
}

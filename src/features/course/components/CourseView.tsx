"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CourseTabs } from "./CourseTabs";
import { chooseInitialTab, readStoredTab, storeTab, subscribeTab, type CourseTabId } from "../courseTabs";
import { CourseMetaHeader } from "./CourseMetaHeader";
import { SourcesList } from "./SourcesList";
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
import { AnswerBlock } from "./AnswerBlock";
import { VideoCards } from "./VideoCards";
import { AddCourseContentButton } from "./learning/AddCourseContentButton";
import { Card } from "@/components/Card";
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
}

/**
 * Rendu complet d'un cours généré.
 * Réutilisé par la page Ask et la page historique détail.
 *
 * Un cours régénéré en entier remplace celui reçu du parent : le contenu est remonté (`key`) pour
 * repartir d'un état neuf — sections ajoutées, overrides et quiz de l'ancien cours n'ont plus cours.
 */
export function CourseView({ data, sessionId }: CourseViewProps) {
  const [regenerated, setRegenerated] = useState<{ course: CourseGenerationResponse; version: number } | null>(null);

  return (
    <CourseContent
      key={regenerated?.version ?? 0}
      data={regenerated?.course ?? data}
      sessionId={sessionId}
      onCourseRegenerated={(course) =>
        setRegenerated((current) => ({ course, version: (current?.version ?? 0) + 1 }))
      }
    />
  );
}

interface CourseContentProps extends CourseViewProps {
  onCourseRegenerated: (course: CourseGenerationResponse) => void;
}

function CourseContent({ data, sessionId: sessionIdProp, onCourseRegenerated }: CourseContentProps) {
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
    storeTab("exercises");
  }

  // « Retour à la section » : l'exercice est refermé (l'onglet Exercices retrouve la liste), onglet Leçons,
  // section courante, puis focus et défilement vers son titre.
  function backToSection(sectionId: string) {
    setOpenExerciseId(null);
    updateProgress((p) => setCurrentSection(p, sectionId));
    storeTab("lessons");
    const index = sections.findIndex((s) => s.id === sectionId);
    if (index >= 0) focusAfterRender(headingIdOf(index));
  }

  // La fenêtre « Générer les exercices ? » ne s'ouvre que sur un cours généré depuis moins d'1 h
  // (meta.generated_at) : pas sur tout l'historique. L'onglet garde le bouton de génération.
  const [mountedAt] = useState(() => Date.now());
  const isFresh = isFreshCourse(data.meta?.generated_at, mountedAt);

  const quizOnOwnPage = quizFlow.phase !== "intro";

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
      <div className="flex items-center gap-2">
        {isMode3 && <Badge variant="indigo">🔍 Recherche web</Badge>}
        {isMode2 && (
          <Badge variant="indigo">📄 Basé sur vos documents</Badge>
        )}
      </div>

      <CourseMetaHeader meta={data.meta} />

      <VideoCards videos={videos.general} sessionId={sessionId} onNoteSaved={saveNote} />

      {sessionId && <SessionPodcast sessionId={sessionId} />}

      {sessionId && hasQuiz && isFresh && <ExercisesOffer sessionId={sessionId} />}

      <CourseTabs
        active={tab}
        onChange={storeTab}
        panels={{
          lessons: (
            <div className="space-y-6">
              {data.introduction && (
                <Card className="p-5">
                  <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                    {typeof data.introduction === "object" ? (
                      Object.entries(data.introduction).map(([key, value]) => (
                        <p key={key}>
                          <span className="font-medium">{key}:</span> {value}
                        </p>
                      ))
                    ) : (
                      <p>{data.introduction}</p>
                    )}
                  </div>
                </Card>
              )}

              <SourcesList sources={data.sources ?? []} />

              {data.answer && (
                <Card className="p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Réponse directe
                  </h2>
                  <AnswerBlock answer={data.answer} />
                </Card>
              )}

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

              {data.common_pitfalls && data.common_pitfalls.length > 0 && (
                <PitfallsList pitfalls={data.common_pitfalls} />
              )}

              {data.summary && <SummaryBlock summary={data.summary} />}

              {nextSteps.length > 0 && <NextStepsList steps={nextSteps} />}

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
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Ce cours n&apos;a pas de quiz.
            </p>
          ),
        }}
      />

      {/* Le quiz en page propre (retour anticipé plus haut) masque le chat */}
      {sessionId && <ChatLauncher sessionId={sessionId} sectionId={chatSectionId} />}
    </div>
  );
}

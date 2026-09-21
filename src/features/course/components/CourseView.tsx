"use client";

import { useEffect } from "react";
import { CourseMetaHeader } from "./CourseMetaHeader";
import { SourcesList } from "./SourcesList";
import { SectionsList } from "./SectionsList";
import { PitfallsList } from "./PitfallsList";
import { QuizPanel } from "./QuizPanel";
import { useQuizFlow } from "../hooks/useQuizFlow";
import { SummaryBlock } from "./SummaryBlock";
import { NextStepsList } from "./NextStepsList";
import { AnswerBlock } from "./AnswerBlock";
import { VideoCards } from "./VideoCards";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SessionPodcast } from "@/features/podcast/components/SessionPodcast";
import type { CourseGenerationResponse } from "../course.types";

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
 */
export function CourseView({ data, sessionId: sessionIdProp }: CourseViewProps) {
  const sessionId = sessionIdProp ?? data.session_id ?? null;
  const isMode3 = data.mode === "question_only";
  const isMode2 = data.mode === "file_question";
  const quiz = data.quiz ?? [];
  const quizFlow = useQuizFlow(quiz);

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

      {data.videos && data.videos.length > 0 && <VideoCards videos={data.videos} />}

      {sessionId && <SessionPodcast sessionId={sessionId} />}

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
            Réponse
          </h2>
          <AnswerBlock answer={data.answer} />
        </Card>
      )}

      {data.sections && data.sections.length > 0 && (
        <SectionsList sections={data.sections} />
      )}

      {data.common_pitfalls && data.common_pitfalls.length > 0 && (
        <PitfallsList pitfalls={data.common_pitfalls} />
      )}

      {quiz.length > 0 && <QuizPanel questions={quiz} flow={quizFlow} />}

      {data.summary && <SummaryBlock summary={data.summary} />}

      {data.next_steps && data.next_steps.length > 0 && (
        <NextStepsList steps={data.next_steps} />
      )}
    </div>
  );
}

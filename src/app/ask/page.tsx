"use client";

import { QuestionInput } from "@/features/course/components/QuestionInput";
import { CourseMetaHeader } from "@/features/course/components/CourseMetaHeader";
import { SourcesList } from "@/features/course/components/SourcesList";
import { SectionsList } from "@/features/course/components/SectionsList";
import { PitfallsList } from "@/features/course/components/PitfallsList";
import { QuizPanel } from "@/features/course/components/QuizPanel";
import { SummaryBlock } from "@/features/course/components/SummaryBlock";
import { NextStepsList } from "@/features/course/components/NextStepsList";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { Card } from "@/components/Card";
import { useGenerateCourse } from "@/features/course/hooks/useGenerateCourse";
import { Badge } from "@/components/Badge";
import type { QuestionInputValues } from "@/features/course/course.schema";

/**
 * Page de question + génération de cours (Mode 2/3).
 *
 * - Mode 2 : question + fichier(s) sélectionné(s)
 * - Mode 3 : question seule → recherche web
 *
 * Le mode est auto-détecté : pas de filename → Mode 3, filename → Mode 2.
 */
export default function AskPage() {
  const { mutate, data, error, isPending, reset } = useGenerateCourse();

  function handleSubmit(values: QuestionInputValues) {
    reset();
    mutate({
      question: values.question,
      filename: values.filename ?? undefined,
      format: values.format,
      language: values.language,
    });
  }

  const isMode3 = data && (!data.meta || !data.sources.some((s) => s.type === "file"));
  const isMode2 = data && data.sources.some((s) => s.type === "file");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Poser une question
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Demandez une explication sur un sujet. Vous pouvez optionally sélectionner
          des fichiers ingestés comme contexte.
        </p>
      </div>

      <Card className="p-5">
        <QuestionInput onSubmit={handleSubmit} isPending={isPending} />
      </Card>

      {isPending && !data && (
        <div className="space-y-4">
          <Skeleton lines={2} />
          <Skeleton lines={4} />
          <Skeleton lines={3} />
        </div>
      )}

      {error && <ErrorState error={error} onRetry={() => reset()} />}

      {data && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {isMode3 && (
              <Badge variant="blue">🔍 Recherche web</Badge>
            )}
            {isMode2 && (
              <Badge variant="indigo">📄 Basé sur vos documents</Badge>
            )}
          </div>

          <CourseMetaHeader meta={data.meta} />

          {data.introduction && (
            <Card className="p-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                {data.introduction}
              </p>
            </Card>
          )}

          <SourcesList sources={data.sources} />

          {data.sections && <SectionsList sections={data.sections} />}

          {data.common_pitfalls && <PitfallsList pitfalls={data.common_pitfalls} />}

          {data.quiz && data.quiz.length > 0 && <QuizPanel questions={data.quiz} />}

          {data.summary && <SummaryBlock summary={data.summary} />}

          {data.next_steps && data.next_steps.length > 0 && (
            <NextStepsList steps={data.next_steps} />
          )}
        </div>
      )}
    </div>
  );
}

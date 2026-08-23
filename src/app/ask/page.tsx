"use client";

import { QuestionInput } from "@/features/course/components/QuestionInput";
import { CourseView } from "@/features/course/components/CourseView";
import { Skeleton } from "@/components/Skeleton";
import { Card } from "@/components/Card";
import { useGenerateCourse } from "@/features/course/hooks/useGenerateCourse";
import type { QuestionInputValues } from "@/features/course/course.schema";

/**
 * Page de question + génération de cours.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Poser une question
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Demandez une explication sur un sujet. Vous pouvez sélectionner
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

      {data && <CourseView data={data} />}
    </div>
  );
}

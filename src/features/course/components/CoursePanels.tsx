"use client";

import { Card } from "@/components/Card";
import { ScrollableQuestion } from "@/components/ScrollableQuestion";
import type { CourseGenerationResponse } from "../course.types";
import { AnswerBlock } from "./AnswerBlock";
import { SourcesList } from "./SourcesList";

/** Bloc « Question » : la question posée (si connue) et la réponse directe. */
export function CourseQuestionPanel({
  question,
  answer,
}: {
  question?: string;
  answer: CourseGenerationResponse["answer"];
}) {
  return (
    <div className="space-y-6">
      {question?.trim() && (
        <Card className="p-5">
          <h2 className="kicker mb-3">Question</h2>
          <ScrollableQuestion markdown={question} />
        </Card>
      )}
      {answer && (
        <Card className="p-5">
          <h2 className="kicker mb-3">Réponse directe</h2>
          <AnswerBlock answer={answer} />
        </Card>
      )}
    </div>
  );
}

/** Introduction et sources du cours (le début du bloc « Cours »). */
export function CourseIntro({
  introduction,
  sources,
}: {
  introduction: CourseGenerationResponse["introduction"];
  sources: CourseGenerationResponse["sources"];
}) {
  return (
    <>
      {introduction && (
        <Card className="p-5">
          <div className="text-sm leading-relaxed text-ink-2 space-y-2">
            {typeof introduction === "object" ? (
              Object.entries(introduction).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium">{key}:</span> {value}
                </p>
              ))
            ) : (
              <p>{introduction}</p>
            )}
          </div>
        </Card>
      )}
      <SourcesList sources={sources ?? []} />
    </>
  );
}

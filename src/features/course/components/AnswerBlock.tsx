"use client";

import { Card } from "@/components/Card";
import { RichText, RichTable } from "./RichText";
import type { CourseAnswer } from "../course.types";

interface AnswerBlockProps {
  answer: CourseAnswer;
}

/**
 * Affiche la réponse structurée d'une section : quoi, pourquoi, comment,
 * example worked, key points. Tous les champs sont optionnels.
 */
export function AnswerBlock({ answer }: AnswerBlockProps) {
  const hasContent = answer.quoi || answer.pourquoi || answer.comment ||
    answer.worked_example?.steps?.length || answer.key_points?.length || answer.tables?.length;

  if (!hasContent) return null;

  return (
    <div className="space-y-4 text-sm text-gray-700">
      {answer.quoi && (
        <div>
          <h4 className="font-medium text-gray-900 mb-1">Quoi</h4>
          <RichText text={answer.quoi} className="leading-relaxed" />
        </div>
      )}

      {answer.pourquoi && (
        <div>
          <h4 className="font-medium text-gray-900 mb-1">Pourquoi</h4>
          <RichText text={answer.pourquoi} className="leading-relaxed" />
        </div>
      )}

      {answer.comment && (
        <div>
          <h4 className="font-medium text-gray-900 mb-1">Comment</h4>
          <RichText text={answer.comment} className="leading-relaxed" />
        </div>
      )}

      {answer.tables?.map((table, i) => (
        <RichTable key={i} headers={table.headers} rows={table.rows} caption={table.caption} />
      ))}

      {answer.worked_example && answer.worked_example.steps?.length > 0 && (
        <Card className="bg-gray-50 p-4">
          <h4 className="font-medium text-gray-900 mb-2">Exemple</h4>
          {answer.worked_example.statement && (
            <p className="text-gray-600 italic mb-3">
              <RichText text={answer.worked_example.statement} />
            </p>
          )}
          <ol className="space-y-2 list-decimal list-inside">
            {answer.worked_example.steps.map((step, i) => (
              <li key={step.id ?? i} className="text-gray-700">
                <RichText text={step.content} />
              </li>
            ))}
          </ol>
          {answer.worked_example.result && (
            <p className="mt-3 text-green-700 font-medium">
              <RichText text={answer.worked_example.result} />
            </p>
          )}
        </Card>
      )}

      {answer.key_points && answer.key_points.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-1">Points clés</h4>
          <ul className="list-disc list-inside space-y-1">
            {answer.key_points.map((point, i) => (
              <li key={i} className="text-gray-600">
                <RichText text={point} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

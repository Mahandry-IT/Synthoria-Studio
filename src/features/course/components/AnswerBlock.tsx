"use client";

import type { CourseAnswer, WorkedExample } from "../course.types";

interface AnswerBlockProps {
  answer: CourseAnswer;
}

interface WorkedExampleViewProps {
  example: WorkedExample;
}

/**
 * Affiche un exemple travaillé (statement + steps + result).
 * Masqué si statement et result sont tous les deux null/vides.
 */
function WorkedExampleView({ example }: WorkedExampleViewProps) {
  const hasContent =
    (example.statement && example.statement.trim().length > 0) ||
    (example.result && example.result.trim().length > 0) ||
    example.steps.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mt-4 rounded-lg bg-gray-50 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Exemple travaillé</h4>

      {example.statement && (
        <p className="text-sm text-gray-600 italic mb-3">{example.statement}</p>
      )}

      {example.steps.length > 0 && (
        <ol className="space-y-2">
          {example.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {i + 1}
              </span>
              <div>
                <span className="font-medium text-gray-800">{step.title}</span>
                <p className="text-gray-600 mt-0.5">{step.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {example.result && (
        <p className="mt-3 text-sm font-medium text-green-700">
          → {example.result}
        </p>
      )}
    </div>
  );
}

/**
 * Bloc réponse structurée : Quoi / Pourquoi / Comment + exemple travaillé.
 */
export function AnswerBlock({ answer }: AnswerBlockProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Quoi</h3>
        <p className="mt-1 text-sm text-gray-700 leading-relaxed">{answer.what}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Pourquoi</h3>
        <p className="mt-1 text-sm text-gray-700 leading-relaxed">{answer.why}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Comment</h3>
        <p className="mt-1 text-sm text-gray-700 leading-relaxed">{answer.how}</p>
      </div>

      {answer.worked_example && <WorkedExampleView example={answer.worked_example} />}
    </div>
  );
}

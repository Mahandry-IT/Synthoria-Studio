"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { ExerciseHints } from "@/features/exercises/components/ExerciseHints";
import { LatexText } from "@/shared/utils/latex";
import type { CycleTrial as CycleTrialData, ExerciseCard, QuizQuestion } from "../../course.types";
import { parseValueInput, pickedOf, valueTextOf } from "../../cycleAnswers";
import { answerKey, type CycleAnswerRecord } from "../../cycleProgress";
import { isAnswerCorrect, isNumericCorrect, optionFeedback, questionKind } from "../../quizGrading";
import { QuizQuestionNumeric } from "../QuizQuestionNumeric";
import { RichText } from "../RichText";
import { ChoiceList, LiveNote, TOUCH_TARGET } from "./cycleUi";

interface AnswerProps {
  getAnswer: (id: string) => CycleAnswerRecord | undefined;
  onAnswer: (id: string, record: CycleAnswerRecord) => void;
}

/** Une question de l'épreuve : retour après validation (bonne réponse, explication), aucune note. */
function TrialQuestion({ question, index, answer, onAnswer }: {
  question: QuizQuestion;
  index: number;
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}) {
  const numeric = questionKind(question) === "numeric";
  const [picked, setPicked] = useState<number[]>([]);
  const [draftText, setText] = useState("");
  const text = valueTextOf(answer, draftText);
  const parsed = parseValueInput(text);
  const validated = Boolean(answer);

  const correct = numeric
    ? isNumericCorrect(question.expected_value, answer?.value)
    : isAnswerCorrect(question, answer?.picked ?? []);
  const canValidate = numeric ? parsed !== null : picked.length > 0;
  const validate = () =>
    onAnswer(numeric ? { value: parsed } : { picked, correct: isAnswerCorrect(question, picked) });

  const perOption = !numeric && validated ? optionFeedback(question, answer?.picked ?? []) : [];
  const marks: Record<number, "correct" | "wrong"> = {};
  if (!numeric && validated) {
    question.options.forEach((_, i) => {
      if (question.correct_option_indices.includes(i)) marks[i] = "correct";
      else if ((answer?.picked ?? []).includes(i)) marks[i] = "wrong";
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      {numeric ? (
        <>
          <p className="text-sm font-medium text-gray-900">
            <span className="mr-1 text-indigo-600">{index + 1}.</span>
            <LatexText text={question.question} />
          </p>
          <QuizQuestionNumeric
            question={question}
            value={text}
            onChange={setText}
            disabled={validated}
            hint="Un nombre, avec une virgule ou un point."
          />
        </>
      ) : (
        <ChoiceList
          legend={
            <>
              <span className="mr-1 text-indigo-600">{index + 1}.</span>
              <LatexText text={question.question} />
            </>
          }
          options={question.options}
          selected={pickedOf(answer, picked)}
          onChange={setPicked}
          multiple={question.correct_option_indices.length > 1}
          disabled={validated}
          marks={marks}
        />
      )}
      {!validated && (
        <Button type="button" className={TOUCH_TARGET} disabled={!canValidate} onClick={validate}>
          Valider
        </Button>
      )}
      <LiveNote tone={validated ? (correct ? "success" : "warn") : "info"}>
        {validated ? (
          <>
            <span className="font-medium">{correct ? "Correct. " : "Pas tout à fait. "}</span>
            {numeric && !correct && question.expected_value != null && (
              <span>
                Réponse attendue : {question.expected_value}
                {question.unit ? ` ${question.unit}` : ""}.{" "}
              </span>
            )}
            {question.explanation && <RichText text={question.explanation} />}
            {perOption.some((f) => f.text) && (
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {perOption.filter((f) => f.text).map((f) => (
                  <li key={f.index}>
                    <RichText text={f.text} />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </LiveNote>
    </div>
  );
}

/** Carte-exercice : énoncé, indice sur demande, tentative libre (non envoyée), puis correction pas à pas. */
function TrialCard({ card, answer, onAnswer }: { card: ExerciseCard; answer?: CycleAnswerRecord; onAnswer: (r: CycleAnswerRecord) => void }) {
  const [hints, setHints] = useState(0);
  const [attempt, setAttempt] = useState("");
  const shown = Boolean(answer);
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <RichText text={card.statement} className="text-sm leading-relaxed text-gray-900" />
      <ExerciseHints hints={card.hint ? [card.hint] : []} revealed={hints} onReveal={() => setHints(1)} />
      <div>
        <label htmlFor="trial-attempt" className="mb-1 block text-sm font-medium text-gray-700">
          Ta tentative <span className="font-normal text-gray-500">(brouillon, non envoyé)</span>
        </label>
        <textarea
          id="trial-attempt"
          rows={4}
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {!shown && (
        <Button type="button" className={TOUCH_TARGET} onClick={() => onAnswer({ picked: [] })}>
          Voir la correction
        </Button>
      )}
      <div aria-live="polite">
        {shown && (
          <section aria-labelledby="trial-correction" className="rounded-lg bg-green-50 p-3 text-sm text-green-950">
            <h5 id="trial-correction" className="mb-2 font-semibold">
              Correction pas à pas
            </h5>
            <ol className="list-decimal space-y-1 pl-5">
              {card.steps.map((step, i) => (
                <li key={i}>
                  <RichText text={step} />
                </li>
              ))}
            </ol>
            {card.result.trim() && (
              <div className="mt-2 overflow-x-auto font-medium">
                <span>Résultat : </span>
                <LatexText text={card.result} autoMath />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/** « Épreuve » : QCM (choix et numérique) ou carte-exercice. Retour sans note. */
export function CycleTrial({ trial, getAnswer, onAnswer }: AnswerProps & { trial: CycleTrialData }) {
  if (trial.kind === "exercise_card") {
    return (
      <TrialCard
        card={trial.card}
        answer={getAnswer(answerKey.trialCard)}
        onAnswer={(record) => onAnswer(answerKey.trialCard, record)}
      />
    );
  }
  return (
    <div className="space-y-3">
      {trial.questions.map((question, i) => (
        <TrialQuestion
          key={i}
          question={question}
          index={i}
          answer={getAnswer(answerKey.trial(i))}
          onAnswer={(record) => onAnswer(answerKey.trial(i), record)}
        />
      ))}
    </div>
  );
}

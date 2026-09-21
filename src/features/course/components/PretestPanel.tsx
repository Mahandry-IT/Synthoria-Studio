"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LatexText } from "@/shared/utils/latex";
import type { PretestItem } from "../course.types";
import { masteredTitles, type PretestAnswers } from "../pretest";

interface PretestPanelProps {
  pretest: PretestItem[];
  /** Appelé à la validation avec les titres (normalisés) des sections réussies. */
  onApply: (mastered: Set<string>) => void;
  disabled?: boolean;
}

/**
 * Pré-test diagnostique facultatif : une question par section de développement.
 * Les sections réussies sont marquées « déjà maîtrisées » et le cours en génère une version condensée.
 */
export function PretestPanel({ pretest, onApply, disabled }: PretestPanelProps) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<PretestAnswers>({});
  const [result, setResult] = useState<number | null>(null);

  if (pretest.length === 0) return null;

  const toggle = (title: string, index: number, multiple: boolean) =>
    setAnswers((current) => {
      const selected = current[title] ?? [];
      const next = multiple
        ? selected.includes(index)
          ? selected.filter((i) => i !== index)
          : [...selected, index]
        : [index];
      return { ...current, [title]: next };
    });

  const submit = () => {
    const mastered = masteredTitles(pretest, answers);
    setResult(mastered.size);
    onApply(mastered);
  };

  if (!open) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-gray-600">
          Vous connaissez déjà une partie du sujet ? Le <strong>pré-test</strong> (facultatif) permet de
          condenser les sections que vous maîtrisez.
        </p>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>
          Faire le pré-test ({pretest.length} question{pretest.length > 1 ? "s" : ""})
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h3 className="text-base font-semibold text-gray-900">Pré-test</h3>
      {pretest.map((item) => {
        const multiple = item.question.correct_option_indices.length > 1;
        return (
          <fieldset key={item.section_title} className="space-y-2" disabled={disabled}>
            <legend className="text-sm font-medium text-gray-900">
              <span className="mr-2 text-xs font-normal text-indigo-600">{item.section_title}</span>
              <LatexText text={item.question.question} />
            </legend>
            {multiple && <p className="text-xs text-gray-500">Plusieurs réponses possibles.</p>}
            {item.question.options.map((option, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={`pretest-${item.section_title}`}
                  checked={(answers[item.section_title] ?? []).includes(i)}
                  onChange={() => toggle(item.section_title, i, multiple)}
                  className="mt-1"
                />
                <LatexText text={option} autoMath />
              </label>
            ))}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={disabled} onClick={submit}>
          Valider le pré-test
        </Button>
        {result !== null && (
          <p role="status" className="text-sm text-green-700">
            {result} section{result > 1 ? "s" : ""} marquée{result > 1 ? "s" : ""} « déjà maîtrisée
            {result > 1 ? "s" : ""} ». Elle{result > 1 ? "s seront condensées" : " sera condensée"} dans le cours.
          </p>
        )}
      </div>
    </Card>
  );
}

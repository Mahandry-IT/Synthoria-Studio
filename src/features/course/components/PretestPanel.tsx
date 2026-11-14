"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Option } from "@/components/Check";
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
        <p className="min-w-0 flex-1 basis-64 text-sm text-ink-2">
          Vous connaissez déjà une partie du sujet ? Le <strong className="font-semibold text-ink">pré-test</strong>{" "}
          (facultatif) permet de condenser les sections que vous maîtrisez.
        </p>
        <Button type="button" variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
          Faire le pré-test ({pretest.length} question{pretest.length > 1 ? "s" : ""})
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-5">
      <h3 className="font-serif text-xl font-medium text-ink">Pré-test</h3>
      {pretest.map((item) => {
        const multiple = item.question.correct_option_indices.length > 1;
        return (
          <fieldset key={item.section_title} className="space-y-2" disabled={disabled}>
            <legend className="mb-1 text-sm font-medium text-ink">
              <span className="mr-2 font-mono text-xs font-normal text-primary">{item.section_title}</span>
              <LatexText text={item.question.question} />
            </legend>
            {multiple && <p className="text-xs text-ink-2">Plusieurs réponses possibles.</p>}
            {item.question.options.map((option, i) => (
              <Option
                key={i}
                type={multiple ? "checkbox" : "radio"}
                name={`pretest-${item.section_title}`}
                checked={(answers[item.section_title] ?? []).includes(i)}
                onChange={() => toggle(item.section_title, i, multiple)}
                label={<LatexText text={option} autoMath />}
              />
            ))}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={disabled} onClick={submit}>
          Valider le pré-test
        </Button>
        {result !== null && (
          <p role="status" className="text-sm text-ok">
            {result} section{result > 1 ? "s" : ""} marquée{result > 1 ? "s" : ""} « déjà maîtrisée
            {result > 1 ? "s" : ""} ». Elle{result > 1 ? "s seront condensées" : " sera condensée"} dans le cours.
          </p>
        )}
      </div>
    </Card>
  );
}

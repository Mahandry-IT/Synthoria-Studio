"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { COURSE_PLAN_MAX_SECTIONS } from "@/shared/utils/constants";
import {
  SECTION_TYPE_LABELS,
  createBlankSection,
  insertSection,
  moveSection,
  removeSection,
  toEditable,
  toPlannedSections,
  updateSection,
  validatePlan,
  type EditableSection,
} from "../planEditing";
import type { CoursePlan, PlannedSection, PlannedSectionType } from "../course.types";

const FIELD_CLASSES = [
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
  "disabled:opacity-50",
].join(" ");

const SECTION_TYPES = Object.keys(SECTION_TYPE_LABELS) as PlannedSectionType[];

interface PlanReviewProps {
  plan: CoursePlan;
  onValidate: (sections: PlannedSection[]) => void;
  onRegenerate: () => void;
  /** Génération du cours en cours : le plan n'est plus modifiable */
  isGenerating: boolean;
}

interface SectionEditorProps {
  section: EditableSection;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onChange: (patch: Partial<Omit<EditableSection, "key">>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onAddAfter: () => void;
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function SectionEditor({
  section,
  index,
  isFirst,
  isLast,
  disabled,
  onChange,
  onMove,
  onRemove,
  onAddAfter,
}: SectionEditorProps) {
  const position = index + 1;
  const id = section.key;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
            {position}
          </span>
          <select
            aria-label={`Type de la section ${position}`}
            value={section.type}
            disabled={disabled}
            onChange={(e) => onChange({ type: e.target.value as PlannedSectionType })}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {SECTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <IconButton label={`Monter la section ${position}`} onClick={() => onMove(-1)} disabled={disabled || isFirst}>
            ↑
          </IconButton>
          <IconButton label={`Descendre la section ${position}`} onClick={() => onMove(1)} disabled={disabled || isLast}>
            ↓
          </IconButton>
          <IconButton label={`Ajouter une section après la section ${position}`} onClick={onAddAfter} disabled={disabled}>
            ＋
          </IconButton>
          <IconButton label={`Supprimer la section ${position}`} onClick={onRemove} disabled={disabled}>
            ✕
          </IconButton>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor={`${id}-title`} className="mb-1 block text-xs font-medium text-gray-600">
            Titre
          </label>
          <input
            id={`${id}-title`}
            type="text"
            value={section.title}
            disabled={disabled}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Titre de la section"
            className={FIELD_CLASSES}
          />
        </div>
        <div>
          <label htmlFor={`${id}-objective`} className="mb-1 block text-xs font-medium text-gray-600">
            Objectif
          </label>
          <textarea
            id={`${id}-objective`}
            rows={2}
            value={section.objective}
            disabled={disabled}
            onChange={(e) => onChange({ objective: e.target.value })}
            placeholder="Ce que l'apprenant doit savoir à l'issue de la section"
            className={`${FIELD_CLASSES} resize-none`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-subtopics`} className="mb-1 block text-xs font-medium text-gray-600">
            Sous-thèmes <span className="font-normal text-gray-400">(un par ligne)</span>
          </label>
          <textarea
            id={`${id}-subtopics`}
            rows={3}
            value={section.subtopicsText}
            disabled={disabled}
            onChange={(e) => onChange({ subtopicsText: e.target.value })}
            className={`${FIELD_CLASSES} resize-y`}
          />
        </div>
      </div>
    </Card>
  );
}

/**
 * Revue et édition du plan d'un cours avant génération complète.
 * L'utilisateur peut modifier, réordonner, ajouter et supprimer des sections,
 * puis valider (→ génération du cours) ou régénérer un nouveau plan.
 *
 * L'état d'édition est local : monter le composant avec `key={plan.plan_id}`
 * pour le réinitialiser quand un nouveau plan arrive.
 */
export function PlanReview({ plan, onValidate, onRegenerate, isGenerating }: PlanReviewProps) {
  const [sections, setSections] = useState<EditableSection[]>(() => toEditable(plan.sections));
  const errors = validatePlan(sections);
  const canAdd = sections.length < COURSE_PLAN_MAX_SECTIONS;

  const addSection = (afterKey?: string) =>
    setSections((current) => insertSection(current, createBlankSection(), afterKey));

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plan du cours</h2>
            <p className="mt-1 text-sm text-gray-600">
              {plan.meta.title}
              {plan.meta.subject ? ` — ${plan.meta.subject}` : ""}
            </p>
          </div>
          <Badge variant="indigo">
            {sections.length} section{sections.length > 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Relisez le plan, modifiez-le si besoin (titres, objectifs, ordre, sections), puis validez pour
          générer le cours complet. Le cours suivra exactement ce plan.
        </p>
        {plan.coverage_notes && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {plan.coverage_notes}
          </p>
        )}
      </Card>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <SectionEditor
            key={section.key}
            section={section}
            index={index}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            disabled={isGenerating}
            onChange={(patch) => setSections((current) => updateSection(current, section.key, patch))}
            onMove={(delta) => setSections((current) => moveSection(current, section.key, delta))}
            onRemove={() => setSections((current) => removeSection(current, section.key))}
            onAddAfter={() => canAdd && addSection(section.key)}
          />
        ))}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-red-600">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          loading={isGenerating}
          disabled={errors.length > 0}
          onClick={() => onValidate(toPlannedSections(sections))}
        >
          Valider et générer le cours complet
        </Button>
        <Button type="button" variant="secondary" disabled={isGenerating || !canAdd} onClick={() => addSection()}>
          Ajouter une section
        </Button>
        <Button type="button" variant="outline" disabled={isGenerating} onClick={onRegenerate}>
          Régénérer le plan
        </Button>
      </div>
    </div>
  );
}

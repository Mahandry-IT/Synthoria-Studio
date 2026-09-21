"use client";

import { useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingModal } from "@/components/LoadingModal";
import { COURSE_PLAN_MAX_SECTIONS } from "@/shared/utils/constants";
import {
  createBlankSection,
  insertGeneratedSections,
  insertSection,
  moveSection,
  removeSection,
  replaceNextSteps,
  toEditable,
  toAssistSections,
  toPlannedSections,
  toSectionPatch,
  updateSection,
  validatePlan,
  type EditableSection,
} from "../planEditing";
import { useMoreSections } from "../hooks/useMoreSections";
import { useRefineSection } from "../hooks/useRefineSection";
import { toastSuccess } from "@/shared/ui/toast";
import type { CoursePlan, PlannedSection } from "../course.types";
import { PlanSectionEditor } from "./PlanSectionEditor";
import { PretestPanel } from "./PretestPanel";
import { applyMastery, relevantPretest } from "../pretest";
import { RefineSectionModal } from "./RefineSectionModal";

interface PlanReviewProps {
  plan: CoursePlan;
  onValidate: (sections: PlannedSection[]) => void;
  onRegenerate: () => void;
  /** Génération du cours en cours : le plan n'est plus modifiable */
  isGenerating: boolean;
}

/**
 * Revue et édition du plan d'un cours avant génération complète.
 * L'utilisateur peut modifier, réordonner, ajouter et supprimer des sections,
 * faire compléter une section par l'IA, ajouter des sections issues de « Pour aller plus loin »,
 * puis valider (→ génération du cours) ou régénérer un nouveau plan.
 *
 * L'état d'édition est local : monter le composant avec `key={plan.plan_id}`
 * pour le réinitialiser quand un nouveau plan arrive.
 */
export function PlanReview({ plan, onValidate, onRegenerate, isGenerating }: PlanReviewProps) {
  const [sections, setSections] = useState<EditableSection[]>(() => toEditable(plan.sections));
  const [refineKey, setRefineKey] = useState<string | null>(null);
  const refine = useRefineSection();
  const moreSections = useMoreSections();

  const errors = validatePlan(sections);
  const canAdd = sections.length < COURSE_PLAN_MAX_SECTIONS;
  const isAssisting = refine.isPending || moreSections.isPending;
  const isLocked = isGenerating || isAssisting;
  const refineTarget = sections.find((s) => s.key === refineKey) ?? null;

  const addSection = (afterKey?: string) =>
    setSections((current) => insertSection(current, createBlankSection(), afterKey));

  const refineSection = (target: EditableSection, instructions: string) => {
    setRefineKey(null);
    const planned = toAssistSections(sections);
    const index = sections.findIndex((s) => s.key === target.key);
    refine.mutate(
      {
        plan_id: plan.plan_id,
        section: planned[index],
        sections: planned,
        instructions: instructions || undefined,
      },
      {
        onSuccess: (refined) => {
          setSections((current) => updateSection(current, target.key, toSectionPatch(refined)));
          toastSuccess("Section complétée. Relisez-la, vous pouvez encore la modifier.");
        },
      },
    );
  };

  const addMoreSections = () =>
    moreSections.mutate(
      { plan_id: plan.plan_id, sections: toAssistSections(sections) },
      {
        onSuccess: ({ sections: generated, nextSteps }) => {
          setSections((current) => replaceNextSteps(insertGeneratedSections(current, generated), nextSteps));
          toastSuccess("Nouvelles sections ajoutées après la dernière section de développement.");
        },
      },
    );

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
          générer le cours complet. Le cours suivra exactement ce plan. Une section vous semble incomplète ?
          Le bouton <AutoAwesomeIcon sx={{ fontSize: 14 }} aria-hidden="true" /> la fait compléter par l&apos;IA.
        </p>
        {plan.coverage_notes && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {plan.coverage_notes}
          </p>
        )}
      </Card>

      <PretestPanel
        pretest={relevantPretest(plan.pretest ?? [], sections)}
        disabled={isLocked}
        onApply={(mastered) => setSections((current) => applyMastery(current, mastered))}
      />

      <div className="space-y-3">
        {sections.map((section, index) => (
          <PlanSectionEditor
            key={section.key}
            section={section}
            index={index}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            disabled={isLocked}
            onChange={(patch) => setSections((current) => updateSection(current, section.key, patch))}
            onMove={(delta) => setSections((current) => moveSection(current, section.key, delta))}
            onRemove={() => setSections((current) => removeSection(current, section.key))}
            onAddAfter={() => canAdd && addSection(section.key)}
            onRefine={() => setRefineKey(section.key)}
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
          disabled={errors.length > 0 || isAssisting}
          onClick={() => onValidate(toPlannedSections(sections))}
        >
          Valider et générer le cours complet
        </Button>
        <Button type="button" variant="outline" disabled={isLocked || !canAdd} onClick={addMoreSections}>
          <AutoAwesomeIcon sx={{ fontSize: 16 }} />
          Ajouter plus de sections
        </Button>
        <Button type="button" variant="secondary" disabled={isLocked || !canAdd} onClick={() => addSection()}>
          Ajouter une section
        </Button>
        <Button type="button" variant="outline" disabled={isLocked} onClick={onRegenerate}>
          Régénérer le plan
        </Button>
      </div>

      {refineTarget && (
        <RefineSectionModal
          sectionTitle={refineTarget.title}
          onSubmit={(instructions) => refineSection(refineTarget, instructions)}
          onCancel={() => setRefineKey(null)}
        />
      )}

      <LoadingModal
        open={refine.isPending}
        icon={<AutoAwesomeIcon sx={{ fontSize: 32 }} />}
        title="Complétion de la section"
        message="L'IA recherche et ajoute les informations manquantes, cela ne devrait prendre que quelques instants…"
      />
      <LoadingModal
        open={moreSections.isPending}
        icon={<AutoStoriesIcon sx={{ fontSize: 32 }} />}
        title="Ajout de nouvelles sections"
        message="L'IA développe les pistes « Pour aller plus loin » en nouvelles sections, merci de patienter…"
      />
    </div>
  );
}

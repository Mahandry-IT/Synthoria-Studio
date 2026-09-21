import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SECTION_TYPE_LABELS, type EditableSection } from "../planEditing";
import type { PlannedSectionType } from "../course.types";
import { PlanIconButton } from "./PlanIconButton";

const FIELD_CLASSES = [
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
  "disabled:opacity-50",
].join(" ");

const SECTION_TYPES = Object.keys(SECTION_TYPE_LABELS) as PlannedSectionType[];

interface PlanSectionEditorProps {
  section: EditableSection;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onChange: (patch: Partial<Omit<EditableSection, "key">>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onAddAfter: () => void;
  /** Ouvre la complétion IA de cette section. */
  onRefine: () => void;
}

/** Carte d'édition d'une section du plan : type, actions (IA, ordre, ajout, suppression) et champs. */
export function PlanSectionEditor({
  section,
  index,
  isFirst,
  isLast,
  disabled,
  onChange,
  onMove,
  onRemove,
  onAddAfter,
  onRefine,
}: PlanSectionEditorProps) {
  const position = index + 1;
  const id = section.key;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
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
          {section.mastery === "known" && (
            <Badge variant="green" title="Pré-test réussi : cette section sera condensée dans le cours">
              Déjà maîtrisée
            </Badge>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center">
          <Button
            type="button"
            size="sm"
            className="mr-1"
            aria-label={`Compléter la section ${position} avec l'IA`}
            title="Compléter cette section avec l'IA"
            disabled={disabled}
            onClick={onRefine}
          >
            <AutoAwesomeIcon sx={{ fontSize: 16 }} />
          </Button>
          <PlanIconButton label={`Monter la section ${position}`} onClick={() => onMove(-1)} disabled={disabled || isFirst}>
            ↑
          </PlanIconButton>
          <PlanIconButton label={`Descendre la section ${position}`} onClick={() => onMove(1)} disabled={disabled || isLast}>
            ↓
          </PlanIconButton>
          <PlanIconButton label={`Ajouter une section après la section ${position}`} onClick={onAddAfter} disabled={disabled}>
            ＋
          </PlanIconButton>
          <PlanIconButton label={`Supprimer la section ${position}`} onClick={onRemove} disabled={disabled}>
            ✕
          </PlanIconButton>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor={`${id}-title`} className="mb-1 block text-xs font-medium text-gray-600">
            Titre
          </label>
          <AutoResizeTextarea
            id={`${id}-title`}
            rows={1}
            value={section.title}
            disabled={disabled}
            onChange={(e) => onChange({ title: e.target.value.replace(/\s*\n\s*/g, " ") })}
            onKeyDown={(e) => {
              // Le titre est sur une seule ligne logique : Entrée ne crée pas de saut de ligne
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="Titre de la section"
            className={FIELD_CLASSES}
          />
        </div>
        <div>
          <label htmlFor={`${id}-objective`} className="mb-1 block text-xs font-medium text-gray-600">
            Objectif
          </label>
          <AutoResizeTextarea
            id={`${id}-objective`}
            rows={2}
            value={section.objective}
            disabled={disabled}
            onChange={(e) => onChange({ objective: e.target.value })}
            placeholder="Ce que l'apprenant doit savoir à l'issue de la section"
            className={FIELD_CLASSES}
          />
        </div>
        <div>
          <label htmlFor={`${id}-subtopics`} className="mb-1 block text-xs font-medium text-gray-600">
            Sous-thèmes <span className="font-normal text-gray-400">(un par ligne)</span>
          </label>
          <AutoResizeTextarea
            id={`${id}-subtopics`}
            rows={3}
            value={section.subtopicsText}
            disabled={disabled}
            onChange={(e) => onChange({ subtopicsText: e.target.value })}
            className={FIELD_CLASSES}
          />
        </div>
      </div>
    </Card>
  );
}

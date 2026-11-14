import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { INLINE_TOOLS } from "@/components/editor/richTextTools";
import { CONTROL_CLASSES, Select } from "@/components/Input";
import { SECTION_TYPE_LABELS, type EditableSection } from "../planEditing";
import type { PlannedSectionType } from "../course.types";
import { PlanIconButton } from "./PlanIconButton";

/** Champ titre : mêmes tokens que `Input` (l'`AutoResizeTextarea` grandit avec son contenu). */
const FIELD_CLASSES = `${CONTROL_CLASSES} block w-full py-2.5`;

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
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-xs font-medium text-primary"
          >
            {String(position).padStart(2, "0")}
          </span>
          <Select
            aria-label={`Type de la section ${position}`}
            value={section.type}
            disabled={disabled}
            onChange={(e) => onChange({ type: e.target.value as PlannedSectionType })}
            fullWidth={false}
          >
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {SECTION_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          {section.mastery === "known" && (
            <Badge variant="ok" title="Pré-test réussi : cette section sera condensée dans le cours">
              Déjà maîtrisée
            </Badge>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center">
          <Button
            type="button"
            size="icon"
            className="mr-1"
            aria-label={`Compléter la section ${position} avec l'IA`}
            title="Compléter cette section avec l'IA"
            disabled={disabled}
            onClick={onRefine}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18 }} />
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

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor={`${id}-title`} className="mb-1.5 block text-sm font-medium text-ink">
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
          <p className="mb-1.5 block text-sm font-medium text-ink">Objectif</p>
          <RichTextEditor
            id={`${id}-objective`}
            ariaLabel={`Objectif de la section ${position}`}
            value={section.objective}
            disabled={disabled}
            onChange={(objective) => onChange({ objective })}
            placeholder="Ce que l'apprenant doit savoir à l'issue de la section"
            tools={INLINE_TOOLS}
            minRows={1}
          />
        </div>
        <div>
          <p className="mb-1.5 block text-sm font-medium text-ink">
            Sous-thèmes <span className="font-normal text-ink-3">(une puce par sous-thème)</span>
          </p>
          <RichTextEditor
            id={`${id}-subtopics`}
            ariaLabel={`Sous-thèmes de la section ${position}`}
            value={section.subtopicsText}
            disabled={disabled}
            onChange={(subtopicsText) => onChange({ subtopicsText })}
            tools={INLINE_TOOLS}
            bulletList
            minRows={3}
          />
        </div>
      </div>
    </Card>
  );
}

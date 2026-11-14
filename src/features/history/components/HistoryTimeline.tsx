import { HistoryItem } from "./HistoryItem";
import type { CourseHistoryItem } from "../history.types";

interface HistoryTimelineProps {
  items: CourseHistoryItem[];
  onDeleteClick: (id: string) => void;
  onMoveClick: (item: CourseHistoryItem) => void;
  /** Affiche la colonne de dossier — vue « Tous les cours » (pas de filtre actif). */
  showFolder?: boolean;
}

/** Colonnes (à partir de `md`) : titre et date, [dossier], type, actions. En mobile, lignes empilées. */
export const HISTORY_GRID_WITH_FOLDER = "md:grid-cols-[minmax(0,1fr)_160px_130px_96px]";
export const HISTORY_GRID_NO_FOLDER = "md:grid-cols-[minmax(0,1fr)_130px_96px]";

/**
 * Liste des cours (ordre de l'API), sous un en-tête de colonnes (visuel, masqué
 * aux lecteurs d'écran : chaque ligne porte déjà ses informations en texte).
 */
export function HistoryTimeline({ items, onDeleteClick, onMoveClick, showFolder = false }: HistoryTimelineProps) {
  const grid = showFolder ? HISTORY_GRID_WITH_FOLDER : HISTORY_GRID_NO_FOLDER;

  return (
    <div>
      <div
        aria-hidden="true"
        className={`kicker hidden gap-4 border-b border-line-2 px-2 pb-2 md:grid ${grid}`}
      >
        <span>Titre</span>
        {showFolder && <span>Dossier</span>}
        <span>Type</span>
        <span />
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="border-b border-line">
            <HistoryItem
              item={item}
              onDeleteClick={onDeleteClick}
              onMoveClick={onMoveClick}
              showFolder={showFolder}
              gridClassName={grid}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

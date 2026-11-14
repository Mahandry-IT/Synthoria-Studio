import { ProgressBar } from "@/components/ProgressBar";
import { boxToDelay, countByBox, BOX_DELAYS } from "../review.logic";
import type { DueCard } from "../review.schema";

interface ReviewBoxesProps {
  /** Cartes de la série en cours : seuls leurs effectifs sont connus (pas de total global côté API). */
  cards: Pick<DueCard, "box">[];
  /** Boîte de la carte affichée, mise en évidence. */
  currentBox: number;
}

/**
 * Panneau « Vos quatre boîtes » : délais J+1, J+3, J+7, J+21 et nombre de cartes de la série en cours
 * dans chacune. Replié dans un `<details>` ouvert sous la carte en mobile, colonne de droite dès `lg`.
 */
export function ReviewBoxes({ cards, currentBox }: ReviewBoxesProps) {
  const counts = countByBox(cards);
  const current = BOX_DELAYS.indexOf(boxToDelay(currentBox));

  return (
    <details open className="rounded-card border border-line bg-surface p-4 lg:border-0 lg:bg-transparent lg:p-0 lg:[&>summary]:cursor-default">
      <summary
        className="cursor-pointer list-none"
        // dès lg le panneau reste ouvert : le clic et Entrée/Espace ne le replient pas
        onClick={(e) => {
          if (window.matchMedia("(min-width: 1024px)").matches) e.preventDefault();
        }}
      >
        <h2 className="font-serif text-xl font-medium text-ink">Vos quatre boîtes</h2>
      </summary>
      <p className="mt-2 text-sm text-ink-2">Les cartes que vous maîtrisez reviennent de moins en moins souvent.</p>
      <p className="kicker mt-4">Dans cette série</p>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {BOX_DELAYS.map((delay, i) => (
          <li
            key={delay}
            aria-current={i === current ? "true" : undefined}
            className={`flex items-center gap-3 py-2.5 pl-2 ${i === current ? "border-l-2 border-accent font-semibold text-ink" : "border-l-2 border-transparent text-ink-2"}`}
          >
            <span className="w-10 shrink-0 font-mono text-xs">{delay}</span>
            <ProgressBar
              className="flex-1"
              label={`Boîte ${delay} : ${counts[i]} carte${counts[i] > 1 ? "s" : ""} dans cette série`}
              value={counts[i]}
              max={Math.max(cards.length, 1)}
            />
            <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums">{counts[i]}</span>
            {i === current && <span className="sr-only">(carte actuelle)</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

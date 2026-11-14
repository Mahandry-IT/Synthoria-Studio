"use client";

import { useRef, useState } from "react";
import { buttonBaseClassName } from "@/components/Button";
import { cx } from "@/shared/utils/cx";
import { LatexText } from "@/shared/utils/latex";
import type { StepSupport } from "../../course.types";
import { checkOrder, initialOrder, moveItem, orderSolution } from "../../cycleActions";
import type { CycleAnswerRecord } from "../../cycleProgress";
import { ActionFrame, WrongFlag, wrongBorder } from "./ActionFrame";

type OrderSupport = Extract<StepSupport, { kind: "order" }>;

interface OrderActionProps {
  support: OrderSupport;
  answer?: CycleAnswerRecord;
  onAnswer: (record: CycleAnswerRecord) => void;
}

const MOVE_BUTTON = cx(buttonBaseClassName("secondary", "icon"), "shrink-0 disabled:cursor-not-allowed disabled:opacity-45");

/**
 * Remettre des éléments dans l'ordre avec des boutons « Monter » / « Descendre » (clavier et tactile,
 * pas de glisser-déposer). Le focus suit l'élément déplacé pour enchaîner les déplacements au clavier.
 */
export function OrderAction({ support, answer, onAnswer }: OrderActionProps) {
  const items = support.order_items;
  const solution = orderSolution(items);
  const [draft, setOrder] = useState<number[]>(() => initialOrder(items));
  const order = answer ? solution : draft;
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const move = (position: number, delta: -1 | 1) => {
    const item = order[position];
    setOrder((cur) => moveItem(cur, position, delta));
    // Le focus reste sur le bouton de l'élément déplacé (ou sur son voisin si le bord est atteint).
    requestAnimationFrame(() => {
      const target = buttons.current.get(`${item}:${delta}`);
      (target && !target.disabled ? target : buttons.current.get(`${item}:${-delta}`))?.focus();
    });
  };

  const register = (key: string) => (node: HTMLButtonElement | null) => {
    if (node) buttons.current.set(key, node);
    else buttons.current.delete(key);
  };

  return (
    <ActionFrame
      instruction={support.order_criterion ? `Remets dans l'ordre : ${support.order_criterion}` : "Remets les éléments dans le bon ordre."}
      answer={answer}
      onAnswer={onAnswer}
      check={() => checkOrder(order)}
      showSolution={() => setOrder(solution)}
    >
      {({ wrong, locked }) => (
        <ol className="space-y-2">
          {order.map((item, position) => (
            <li key={item} className={`flex items-center gap-2 rounded-ctrl border p-2 ${wrongBorder(wrong.includes(position))}`}>
              <span className="w-7 shrink-0 text-center font-mono text-xs text-ink-3">{position + 1}</span>
              <span className="min-w-0 flex-1 text-sm text-ink">
                <LatexText text={items[item]} />
              </span>
              <WrongFlag show={wrong.includes(position)} />
              {!locked && (
                <>
                  <button
                    type="button"
                    ref={register(`${item}:-1`)}
                    className={MOVE_BUTTON}
                    disabled={position === 0}
                    onClick={() => move(position, -1)}
                  >
                    <span aria-hidden="true">↑</span>
                    <span className="sr-only">Monter « {items[item]} »</span>
                  </button>
                  <button
                    type="button"
                    ref={register(`${item}:1`)}
                    className={MOVE_BUTTON}
                    disabled={position === order.length - 1}
                    onClick={() => move(position, 1)}
                  >
                    <span aria-hidden="true">↓</span>
                    <span className="sr-only">Descendre « {items[item]} »</span>
                  </button>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </ActionFrame>
  );
}

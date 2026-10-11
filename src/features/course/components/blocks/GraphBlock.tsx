"use client";

import { useId, useMemo } from "react";
import type { CourseGraph } from "../../course.types";
import { useGraphSteps } from "../../hooks/useGraphSteps";
import { GraphStepControls } from "./GraphStepControls";
import {
  EDGE_LABEL_MAX,
  edgeGeometry,
  layoutGraph,
  loopGeometry,
  NODE_LABEL_MAX,
  truncateLabel,
  validEdges,
} from "./graphGeometry";

/** `idle` : schéma statique ; `on` / `dim` : mis en avant ou atténué par l'étape courante. */
type Tone = "idle" | "on" | "dim";

const TONES: Tone[] = ["idle", "on", "dim"];
const TRANSITION = "transition-[fill,stroke] duration-300 motion-reduce:transition-none";

const NODE_CLASS: Record<Tone, string> = {
  idle: "fill-indigo-50 stroke-indigo-500",
  on: "fill-indigo-600 stroke-indigo-700",
  dim: "fill-white stroke-gray-300",
};
const NODE_TEXT_CLASS: Record<Tone, string> = {
  idle: "fill-indigo-950",
  on: "fill-white",
  dim: "fill-gray-500",
};
const EDGE_CLASS: Record<Tone, string> = {
  idle: "stroke-gray-500",
  on: "stroke-indigo-600",
  dim: "stroke-gray-300",
};
const ARROW_CLASS: Record<Tone, string> = {
  idle: "fill-gray-500",
  on: "fill-indigo-600",
  dim: "fill-gray-300",
};
const EDGE_TEXT_CLASS: Record<Tone, string> = {
  idle: "fill-gray-700",
  on: "fill-indigo-700 font-semibold",
  dim: "fill-gray-500",
};

/**
 * Graphe, arbre ou dépendances en SVG pur, avec pas-à-pas facultatif. Le serveur n'envoie que des
 * données : disposition calculée ici (`graphGeometry`). Libellés et légendes viennent du modèle :
 * rendus uniquement comme texte React, jamais comme HTML.
 */
export function GraphBlock({ graph }: { graph: CourseGraph }) {
  const markerId = useId().replace(/:/g, "");
  const layout = useMemo(() => layoutGraph(graph), [graph]);
  const edges = useMemo(() => validEdges(graph), [graph]);
  const steps = graph.steps ?? [];
  const { index, next, previous, reset } = useGraphSteps(steps.length);

  const step = steps[index];
  const activeNodes = new Set(step?.highlight_nodes);
  const activeEdges = new Set(step?.highlight_edges);
  const toneOf = (active: boolean): Tone => (step ? (active ? "on" : "dim") : "idle");
  const hasEdge = (source: string, target: string) => edges.some((e) => e.source === source && e.target === target);

  return (
    <figure className="my-3 w-full rounded-lg border border-gray-200 bg-white p-3">
      {graph.caption && <figcaption className="mb-2 text-sm font-semibold text-gray-900">{graph.caption}</figcaption>}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label={graph.caption || "Graphe"}
          className="mx-auto h-auto w-full"
          style={{ minWidth: Math.min(layout.width * 0.6, 320), maxWidth: layout.width }}
        >
          {graph.directed && (
            <defs>
              {TONES.map((tone) => (
                <marker
                  key={tone}
                  id={`${markerId}-${tone}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="9"
                  markerHeight="9"
                  markerUnits="userSpaceOnUse"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" className={ARROW_CLASS[tone]} />
                </marker>
              ))}
            </defs>
          )}

          {edges.map((edge, i) => {
            const from = layout.positions.get(edge.source);
            const to = layout.positions.get(edge.target);
            if (!from || !to) return null;
            const tone = toneOf(activeEdges.has(edge.id));
            const isLoop = edge.source === edge.target;
            const shape = isLoop
              ? loopGeometry(from, { x: layout.width / 2, y: layout.height / 2 }, layout)
              : edgeGeometry(from, to, layout, graph.directed && hasEdge(edge.target, edge.source));
            return (
              <g key={i}>
                <path
                  d={shape.d}
                  fill="none"
                  strokeWidth={tone === "on" ? 3 : 1.5}
                  markerEnd={graph.directed ? `url(#${markerId}-${tone})` : undefined}
                  className={`${EDGE_CLASS[tone]} ${TRANSITION}`}
                />
                {edge.label && (
                  <text
                    x={shape.label.x}
                    y={shape.label.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    stroke="#fff"
                    strokeWidth="4"
                    paintOrder="stroke"
                    className={`${EDGE_TEXT_CLASS[tone]} ${TRANSITION}`}
                  >
                    <title>{edge.label}</title>
                    {truncateLabel(edge.label, EDGE_LABEL_MAX)}
                  </text>
                )}
              </g>
            );
          })}

          {graph.nodes.map((node, i) => {
            const position = layout.positions.get(node.id);
            if (!position) return null;
            const tone = toneOf(activeNodes.has(node.id));
            return (
              <g key={i}>
                <title>{node.label}</title>
                <ellipse
                  cx={position.x}
                  cy={position.y}
                  rx={layout.rx}
                  ry={layout.ry}
                  strokeWidth="1.5"
                  className={`${NODE_CLASS[tone]} ${TRANSITION}`}
                />
                <text
                  x={position.x}
                  y={position.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                  className={`${NODE_TEXT_CLASS[tone]} ${TRANSITION}`}
                >
                  {truncateLabel(node.label, NODE_LABEL_MAX)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {step && (
        <GraphStepControls
          index={index}
          total={steps.length}
          caption={step.caption}
          onPrevious={previous}
          onNext={next}
          onReset={reset}
        />
      )}
    </figure>
  );
}

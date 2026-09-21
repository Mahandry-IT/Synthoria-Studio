import type { CourseChart } from "../../course.types";
import { axisMax, pieSlices } from "./chartGeometry";

const PALETTE = ["#4f46e5", "#0891b2", "#d97706", "#db2777"];
const W = 480;
const H = 240;
const PAD = { top: 12, right: 12, bottom: 44, left: 40 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

const colorOf = (i: number) => PALETTE[i % PALETTE.length];

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const point = (a: number) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`;
  if (end - start >= Math.PI * 2 - 1e-6) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  return `M ${cx} ${cy} L ${point(start)} A ${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${point(end)} Z`;
}

/** Graphique en SVG pur (barres, courbes, secteurs) : aucune dépendance, aucune injection HTML. */
export function ChartBlock({ chart }: { chart: CourseChart }) {
  const max = axisMax(chart.series.map((s) => s.values));
  const step = plotW / Math.max(chart.labels.length, 1);
  const y = (v: number) => PAD.top + plotH - (Math.max(v, 0) / max) * plotH;

  return (
    <figure className="my-3 w-full rounded-lg border border-gray-200 bg-white p-3">
      {chart.caption && <figcaption className="mb-2 text-sm font-semibold text-gray-900">{chart.caption}</figcaption>}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={chart.caption || "Graphique"}
          className="mx-auto h-auto w-full min-w-[320px] max-w-xl"
        >
          {chart.kind === "pie" ? (
            pieSlices(chart.series[0]?.values ?? []).map((slice, i) => (
              <path key={i} d={arcPath(W / 2, H / 2, H / 2 - 12, slice.start, slice.end)} fill={colorOf(i)} stroke="#fff">
                <title>{`${chart.labels[i] ?? ""} : ${slice.value}`}</title>
              </path>
            ))
          ) : (
            <>
              <line x1={PAD.left} y1={PAD.top + plotH} x2={W - PAD.right} y2={PAD.top + plotH} stroke="#9ca3af" />
              <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#9ca3af" />
              <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                {max}
              </text>
              <text x={PAD.left - 6} y={PAD.top + plotH} textAnchor="end" fontSize="10" fill="#6b7280">
                0
              </text>
              {chart.labels.map((label, i) => (
                <text
                  key={i}
                  x={PAD.left + step * i + step / 2}
                  y={H - 22}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                >
                  {label.length > 12 ? `${label.slice(0, 11)}…` : label}
                </text>
              ))}
              {chart.kind === "bar"
                ? chart.series.map((s, si) => {
                    const barW = (step * 0.7) / chart.series.length;
                    return s.values.map((v, i) => (
                      <rect
                        key={`${si}-${i}`}
                        x={PAD.left + step * i + step * 0.15 + barW * si}
                        y={y(v)}
                        width={barW}
                        height={PAD.top + plotH - y(v)}
                        fill={colorOf(si)}
                      >
                        <title>{`${s.name} — ${chart.labels[i] ?? ""} : ${v}`}</title>
                      </rect>
                    ));
                  })
                : chart.series.map((s, si) => (
                    <g key={si}>
                      <polyline
                        fill="none"
                        stroke={colorOf(si)}
                        strokeWidth="2"
                        points={s.values.map((v, i) => `${PAD.left + step * i + step / 2},${y(v)}`).join(" ")}
                      />
                      {s.values.map((v, i) => (
                        <circle key={i} cx={PAD.left + step * i + step / 2} cy={y(v)} r="3" fill={colorOf(si)}>
                          <title>{`${s.name} — ${chart.labels[i] ?? ""} : ${v}`}</title>
                        </circle>
                      ))}
                    </g>
                  ))}
            </>
          )}
        </svg>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {(chart.kind === "pie" ? chart.labels : chart.series.map((s) => s.name)).map((name, i) => (
          <li key={i} className="flex items-center gap-1">
            <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: colorOf(i) }} />
            {name}
          </li>
        ))}
      </ul>
    </figure>
  );
}

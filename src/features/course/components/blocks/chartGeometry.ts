export interface PieSlice {
  start: number;
  end: number;
  value: number;
}

/** Angles (radians, départ à midi) de chaque part ; valeurs négatives ignorées. Somme nulle → aucune part. */
export function pieSlices(values: number[]): PieSlice[] {
  const positive = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = positive.reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  let angle = 0;
  return positive.map((value) => {
    const start = angle;
    angle += (value / total) * Math.PI * 2;
    return { start, end: angle, value };
  });
}

/** Borne haute de l'axe des ordonnées (≥ 0), jamais nulle pour éviter une division par zéro. */
export function axisMax(series: number[][]): number {
  const max = Math.max(0, ...series.flat().filter(Number.isFinite));
  return max === 0 ? 1 : max;
}

/**
 * Pure helpers for the creator-economy report's server-rendered SVG charts.
 * Kept free of React so the geometry/format rules are unit-testable.
 */

/** Compact human number for direct labels: 1_709_252 -> "1.71M", 5_144 -> "5.1K". */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  // 999_500+ would otherwise round to "1000K" in the K branch.
  if (abs >= 999_500) return `${trimZeros((n / 1_000_000).toFixed(2))}M`;
  if (abs >= 10_000) return `${trimZeros((n / 1_000).toFixed(0))}K`;
  if (abs >= 1_000) return `${trimZeros((n / 1_000).toFixed(1))}K`;
  return `${n}`;
}

function trimZeros(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

/** Full number with thousands separators for tables. */
export function formatFull(n: number): string {
  return n.toLocaleString("en-US");
}

/** QoQ delta in percent, or null when the base is missing/zero. */
export function deltaPct(current: number, previous?: number | null): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Rounded-top column path: square at the baseline, 4px-radius data end
 * (mark spec). Degrades to a plain rect when the bar is shorter than the radius.
 */
export function columnPath(x: number, yTop: number, width: number, height: number, r = 4): string {
  if (height <= 0) return "";
  const rr = Math.min(r, height, width / 2);
  const yBase = yTop + height;
  return (
    `M${x},${yBase} L${x},${yTop + rr} Q${x},${yTop} ${x + rr},${yTop} ` +
    `L${x + width - rr},${yTop} Q${x + width},${yTop} ${x + width},${yTop + rr} ` +
    `L${x + width},${yBase} Z`
  );
}

/** Rounded-END horizontal bar path: square at the left baseline, rounded right cap. */
export function hbarPath(x: number, y: number, width: number, height: number, r = 4): string {
  if (width <= 0) return "";
  const rr = Math.min(r, width, height / 2);
  return (
    `M${x},${y} L${x + width - rr},${y} Q${x + width},${y} ${x + width},${y + rr} ` +
    `L${x + width},${y + height - rr} Q${x + width},${y + height} ${x + width - rr},${y + height} ` +
    `L${x},${y + height} Z`
  );
}

/** Scale max with headroom so caps + labels never touch the top edge. */
export function scaleMax(values: number[]): number {
  const max = Math.max(0, ...values);
  return max === 0 ? 1 : max * 1.12;
}

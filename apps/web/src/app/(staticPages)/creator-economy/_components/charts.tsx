import React from "react";
import { columnPath, formatCompact, formatFull, hbarPath, scaleMax } from "./chart-utils";

/**
 * Server-rendered SVG charts (zero client JS). Colors come from CSS custom
 * properties defined on .ce-viz (light + .dark overrides in the page), so the
 * marks respond to the site theme without hydration. Text wears text tokens,
 * never the series color; every mark carries a native <title> tooltip and the
 * page ships full tables as the accessible view.
 */

// Two validated series slots; charts on this page use at most two series.
// Extra series (should never happen) reuse slot 1 rather than render unfilled.
const SERIES_VARS = ["var(--ce-s1)", "var(--ce-s2)"] as const;
const seriesColor = (i: number) => SERIES_VARS[i] ?? SERIES_VARS[0];

interface ColumnSeries {
  name: string;
  values: number[];
}

export function ColumnChart({
  labels,
  series,
  ariaLabel,
  valueFormatter = formatCompact,
  readoutFormatter
}: {
  labels: string[];
  series: ColumnSeries[]; // 1-2 series (grouped)
  ariaLabel: string;
  valueFormatter?: (n: number) => string;
  /** unused here: columns carry direct cap labels; kept for Trend prop parity */
  readoutFormatter?: (n: number) => string;
}) {
  const W = 560;
  const H = 230;
  const padX = 8;
  const padTop = 26; // room for cap labels
  const padBottom = 26; // quarter labels
  const plotH = H - padTop - padBottom;
  const groups = labels.length;
  const groupW = (W - padX * 2) / groups;
  const barW = Math.min(24, Math.max(6, (groupW - 8) / series.length - 2)); // mark spec: <=24px
  const gap = 2; // surface gap between grouped bars
  const max = scaleMax(series.flatMap((s) => s.values));
  // Selective labeling for dense charts: at many groups the x-axis shows only
  // the labels the caller kept (pass "" to skip), fonts shrink a step, and
  // multi-series cap values are dropped entirely (legend + table carry them).
  const dense = groups > 8;
  const fontSize = dense ? 10 : 12;
  const showCapValues = series.length === 1 || !dense;

  return (
    <div>
      {series.length > 1 && (
        <div className="flex items-center gap-4 mb-2 text-sm text-gray-600 dark:text-gray-400">
          {series.map((s, si) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: seriesColor(si) }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        className="w-full h-auto"
      >
        {/* recessive baseline hairline */}
        <line x1={padX} y1={H - padBottom} x2={W - padX} y2={H - padBottom} stroke="var(--ce-grid)" strokeWidth={1} />
        {labels.map((label, gi) => {
          const groupX = padX + gi * groupW;
          const clusterW = series.length * barW + (series.length - 1) * gap;
          const startX = groupX + (groupW - clusterW) / 2;
          return (
            <g key={`${label}-${gi}`}>
              {series.map((s, si) => {
                const v = s.values[gi] ?? 0;
                const h = Math.round((v / max) * plotH);
                const x = startX + si * (barW + gap);
                const yTop = H - padBottom - h;
                return (
                  <g key={s.name}>
                    {/* Bare mark: no svg <title> (naive first-title parsers would
                        read a tooltip as the document title, which streams late)
                        and no per-mark aria (the outer svg role="img" is atomic,
                        so children are pruned from the a11y tree). Values live in
                        the visible cap labels and the table views. */}
                    <path d={columnPath(x, yTop, barW, h)} fill={seriesColor(si)} aria-hidden="true" />
                    {/* direct label on the cap; text token, not series color */}
                    {showCapValues && (
                      <text
                        x={x + barW / 2}
                        y={yTop - 6}
                        textAnchor="middle"
                        fontSize={fontSize}
                        fill="var(--ce-text2)"
                      >
                        {valueFormatter(v)}
                      </text>
                    )}
                  </g>
                );
              })}
              {label && (
                <text
                  x={groupX + groupW / 2}
                  y={H - padBottom + 18}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill="var(--ce-text2)"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Trend line for dense series (>12 points, where columns stop working).
 * Mark specs: 2px round-join line, >=8px end dot with a 2px surface ring,
 * ~10% area wash for a single series. Labels are selective (first / peak /
 * last values; year ticks on the x-axis) - the table views carry every value.
 *
 * Hover: pure-CSS per-point bands (see .ce-hband/.ce-hlbl in the page's style
 * block) reveal a hairline, point dots and a fixed readout with the exact
 * values. No client JS, and no svg <title> tooltips - a streamed-late document
 * <title> means naive parsers would read a tooltip as the page title.
 */
export function LineChart({
  labels,
  series,
  ariaLabel,
  valueFormatter = formatCompact,
  readoutFormatter = formatFull
}: {
  labels: string[]; // one per point, e.g. "Q2 2020"
  series: ColumnSeries[]; // 1-2 series
  ariaLabel: string;
  valueFormatter?: (n: number) => string;
  /** hover readout shows EXACT values; sparse on-chart labels stay compact */
  readoutFormatter?: (n: number) => string;
}) {
  const W = 560;
  const H = 230;
  const padX = 10;
  const padTop = 26;
  const padBottom = 26;
  const plotH = H - padTop - padBottom;
  const plotW = W - padX * 2;
  const n = labels.length;
  const max = scaleMax(series.flatMap((s) => s.values));
  const px = (i: number) => padX + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const py = (v: number) => H - padBottom - (v / max) * plotH;

  // Year ticks: first point of each year (labels like "Q1 2023"), plus the
  // very first point when it starts mid-year.
  const yearTicks = labels
    .map((l, i) => ({ l, i }))
    .filter(({ l, i }) => i === 0 || l.startsWith("Q1 "))
    .map(({ l, i }) => ({ i, text: l.split(" ")[1] ?? l }));

  return (
    <div>
      {series.length > 1 && (
        <div className="flex items-center gap-4 mb-2 text-sm text-gray-600 dark:text-gray-400">
          {series.map((s, si) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: seriesColor(si) }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="w-full h-auto">
        <line
          x1={padX}
          y1={H - padBottom}
          x2={W - padX}
          y2={H - padBottom}
          stroke="var(--ce-grid)"
          strokeWidth={1}
        />
        {yearTicks.map((tick) => (
          <text
            key={tick.i}
            x={px(tick.i)}
            y={H - padBottom + 18}
            textAnchor={tick.i === 0 ? "start" : "middle"}
            fontSize={11}
            fill="var(--ce-text2)"
          >
            {tick.text}
          </text>
        ))}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`);
          const peakIdx = s.values.indexOf(Math.max(...s.values));
          // labels and every series' values must be the same length; bound by
          // both so a mismatched caller cannot place marks off-axis
          const lastIdx = Math.min(s.values.length, n) - 1;
          // Selective labels by priority (last > peak > first), dropping any
          // candidate within the collision window of an already-kept label.
          const labelIdxs = [lastIdx, peakIdx, 0]
            .reduce<number[]>((kept, i) => {
              if (i < 0 || kept.includes(i)) return kept;
              if (kept.some((j) => Math.abs(i - j) <= 2)) return kept;
              return [...kept, i];
            }, [])
            .sort((a, b) => a - b);
          return (
            <g key={s.name} aria-hidden="true">
              {series.length === 1 && (
                <path
                  d={`M${pts[0]} L${pts.join(" L")} L${px(lastIdx).toFixed(1)},${H - padBottom} L${px(0).toFixed(1)},${H - padBottom} Z`}
                  fill={seriesColor(si)}
                  opacity={0.1}
                />
              )}
              <polyline
                points={pts.join(" ")}
                fill="none"
                stroke={seriesColor(si)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* end dot with surface ring */}
              <circle
                cx={px(lastIdx)}
                cy={py(s.values[lastIdx])}
                r={4}
                fill={seriesColor(si)}
                stroke="var(--ce-surface)"
                strokeWidth={2}
              />
              {labelIdxs.map((i) => (
                <text
                  key={i}
                  x={px(i)}
                  y={py(s.values[i]) - 8 - (series.length > 1 && si === 1 ? 12 : 0)}
                  textAnchor={i === 0 ? "start" : i === lastIdx ? "end" : "middle"}
                  fontSize={11}
                  fill="var(--ce-text2)"
                >
                  {valueFormatter(s.values[i])}
                </text>
              ))}
            </g>
          );
        })}
        {/* hover layer: one hit band per point; CSS reveals the readout */}
        <g aria-hidden="true">
          {labels.map((label, i) => {
            const left = i === 0 ? 0 : (px(i - 1) + px(i)) / 2;
            const right = i === n - 1 ? W : (px(i) + px(i + 1)) / 2;
            return (
              <g key={`h-${i}`} className="ce-hband">
                <rect x={left} y={0} width={right - left} height={H} fill="transparent" />
                <g className="ce-hlbl">
                  <line
                    x1={px(i)}
                    y1={padTop}
                    x2={px(i)}
                    y2={H - padBottom}
                    stroke="var(--ce-text2)"
                    strokeWidth={1}
                    opacity={0.4}
                  />
                  {series.map((s, si) => (
                    <circle
                      key={s.name}
                      cx={px(i)}
                      cy={py(s.values[i] ?? 0)}
                      r={4}
                      fill={seriesColor(si)}
                      stroke="var(--ce-surface)"
                      strokeWidth={2}
                    />
                  ))}
                  <text
                    x={padX}
                    y={20}
                    textAnchor="start"
                    fontSize={11}
                    fill="var(--ce-text2)"
                    stroke="var(--ce-surface)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {label}
                    {series.map((s) =>
                      series.length > 1
                        ? ` · ${s.name} ${readoutFormatter(s.values[i] ?? 0)}`
                        : ` · ${readoutFormatter(s.values[i] ?? 0)}`
                    )}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function HBarChart({
  items,
  ariaLabel
}: {
  items: { label: string; value: number }[];
  ariaLabel: string;
}) {
  const W = 560;
  const rowH = 34;
  const barH = 14; // thin mark
  const labelW = 190;
  const valueW = 52;
  const H = items.length * rowH;
  const max = scaleMax(items.map((i) => i.value));
  const plotW = W - labelW - valueW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="w-full h-auto">
      {items.map((item, i) => {
        const y = i * rowH + (rowH - barH) / 2;
        const w = Math.max(2, Math.round((item.value / max) * plotW));
        return (
          <g key={item.label}>
            <text
              x={labelW - 10}
              y={y + barH - 3}
              textAnchor="end"
              fontSize={12}
              fill="var(--ce-text2)"
            >
              {item.label.length > 26 ? `${item.label.slice(0, 25)}…` : item.label}
            </text>
            <path d={hbarPath(labelW, y, w, barH)} fill="var(--ce-s1)" aria-hidden="true" />
            <text x={labelW + w + 8} y={y + barH - 3} fontSize={12} fill="var(--ce-text2)">
              {item.value.toLocaleString("en-US")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StatTile({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta: number | null;
}) {
  return (
    <div className="rounded-xl border border-[--border-color] bg-gray-100 dark:bg-dark-200 p-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-2xl md:text-3xl font-semibold mt-1">{value}</div>
      {delta !== null && (
        <div
          className={`text-xs mt-1 ${delta >= 0 ? "text-green" : "text-red"}`}
          aria-label={`${delta >= 0 ? "up" : "down"} ${Math.abs(delta)} percent vs previous quarter`}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs prev quarter
        </div>
      )}
    </div>
  );
}

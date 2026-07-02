import React from "react";
import { columnPath, formatCompact, hbarPath, scaleMax } from "./chart-utils";

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
  valueFormatter = formatCompact
}: {
  labels: string[];
  series: ColumnSeries[]; // 1-2 series (grouped)
  ariaLabel: string;
  valueFormatter?: (n: number) => string;
}) {
  const W = 560;
  const H = 230;
  const padX = 8;
  const padTop = 26; // room for cap labels
  const padBottom = 26; // quarter labels
  const plotH = H - padTop - padBottom;
  const groups = labels.length;
  const groupW = (W - padX * 2) / groups;
  const barW = Math.min(24, (groupW - 16) / series.length); // mark spec: <=24px
  const gap = 2; // surface gap between grouped bars
  const max = scaleMax(series.flatMap((s) => s.values));

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
            <g key={label}>
              {series.map((s, si) => {
                const v = s.values[gi] ?? 0;
                const h = Math.round((v / max) * plotH);
                const x = startX + si * (barW + gap);
                const yTop = H - padBottom - h;
                return (
                  <g key={s.name}>
                    <path d={columnPath(x, yTop, barW, h)} fill={seriesColor(si)}>
                      <title>{`${label}${series.length > 1 ? ` ${s.name}` : ""}: ${v.toLocaleString("en-US")}`}</title>
                    </path>
                    {/* direct label on the cap; text token, not series color */}
                    <text
                      x={x + barW / 2}
                      y={yTop - 6}
                      textAnchor="middle"
                      fontSize={12}
                      fill="var(--ce-text2)"
                    >
                      {valueFormatter(v)}
                    </text>
                  </g>
                );
              })}
              <text
                x={groupX + groupW / 2}
                y={H - padBottom + 18}
                textAnchor="middle"
                fontSize={12}
                fill="var(--ce-text2)"
              >
                {label}
              </text>
            </g>
          );
        })}
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
            <path d={hbarPath(labelW, y, w, barH)} fill="var(--ce-s1)">
              <title>{`${item.label}: ${item.value.toLocaleString("en-US")}`}</title>
            </path>
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

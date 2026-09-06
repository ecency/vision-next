"use client";

import clsx from "clsx";
import i18next from "i18next";
import { UilAngleDown, UilSlidersVAlt } from "@tooni/iconscout-unicons-react";
import type { CurationApp, CurationWindow } from "@ecency/sdk";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { WORD_PRESETS } from "./consts";
import { countActiveFilters } from "./hooks";
import type { QueueFilters, ResolvedQueueFilters } from "./types";

interface Props {
  filters: ResolvedQueueFilters;
  isRoster: boolean;
  communities: Array<{ community: string; title?: string | null; count?: number }>;
  onChange: (patch: Partial<QueueFilters>) => void;
}

function ToggleChip({
  on,
  label,
  onClick,
  tone
}: {
  on: boolean;
  label: string;
  onClick: () => void;
  tone?: "red";
}) {
  return (
    <Button
      size="xs"
      appearance={on ? "pressed" : "gray-link"}
      outline={!on}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={clsx(
        "!rounded-full !min-h-[36px]",
        on && "!bg-blue-dark-sky/10 !text-blue-dark-sky",
        tone === "red" && on && "!bg-red/10 !text-red-030 dark:!bg-red/20 dark:!text-red-light-020"
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

const APPS: CurationApp[] = ["all", "ecency", "peakd", "other"];
const WINDOWS: CurationWindow[] = ["all", "full", "half", "eighth", "locked"];

/**
 * Filter chips of spec 8.13. Every chip maps to a server param through
 * filtersToParams, never to a client-side row filter.
 */
export function CurationSortFilterBar({ filters, isRoster, communities, onChange }: Props) {
  // Same tally the toolbar's Reset button shows, minus the two chips above.
  const advancedCount = countActiveFilters(filters, isRoster, "refine");
  return (
    <div
      className="flex flex-wrap items-start gap-3 px-4 pb-4 sm:px-5 text-xs"
      role="group"
      aria-label={i18next.t("curation-desk.filters.aria")}
    >
      <div className="flex flex-wrap items-center gap-2 py-1">
        {isRoster && (
          <ToggleChip
            on={filters.unreviewedOnly}
            label={i18next.t("curation-desk.filters.unreviewed")}
            onClick={() => onChange({ unreviewedOnly: !filters.unreviewedOnly })}
          />
        )}
        <ToggleChip
          on={filters.hideCurated}
          label={i18next.t("curation-desk.filters.hide-curated")}
          onClick={() => onChange({ hideCurated: !filters.hideCurated })}
        />
      </div>
      <details className="group/filters min-w-[12rem] flex-1 rounded-xl border border-[--border-color] open:basis-full">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 text-sm focus-visible:outline-blue-dark-sky [&::-webkit-details-marker]:hidden">
          <UilSlidersVAlt className="size-4 text-gray-500" aria-hidden />
          <span className="font-medium">{i18next.t("curation-desk.filters.refine")}</span>
          {advancedCount > 0 && (
            <span
              className="rounded-full bg-blue-dark-sky/10 px-2 py-0.5 text-xs text-blue-dark-sky"
              aria-label={i18next.t("curation-desk.filters.active-count", { count: advancedCount })}
            >
              {advancedCount}
            </span>
          )}
          <span className="ml-auto hidden truncate text-xs text-gray-500 sm:inline">
            {i18next.t("curation-desk.filters.refine-hint")}
          </span>
          <UilAngleDown
            className="ml-auto size-4 text-gray-500 transition-transform group-open/filters:rotate-180 sm:ml-1"
            aria-hidden
          />
        </summary>
        <div className="grid gap-5 border-t border-[--border-color] p-4 sm:grid-cols-2 lg:grid-cols-3">
          <fieldset className="min-w-0 space-y-3">
            <legend className="mb-3 font-semibold text-gray-600 dark:text-gray-400">
              {i18next.t("curation-desk.filters.source")}
            </legend>
            <label className="block space-y-1.5">
              <span>{i18next.t("curation-desk.filters.app")}</span>
              <FormControl
                type="select"
                size="sm"
                value={filters.app}
                aria-label={i18next.t("curation-desk.filters.app")}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onChange({ app: e.target.value as CurationApp })
                }
              >
                {APPS.map((app) => (
                  <option key={app} value={app}>
                    {i18next.t(`curation-desk.filters.app-${app}`)}
                  </option>
                ))}
              </FormControl>
            </label>
            <label className="block space-y-1.5">
              <span>{i18next.t("curation-desk.filters.community")}</span>
              <FormControl
                type="select"
                size="sm"
                value={filters.community}
                aria-label={i18next.t("curation-desk.filters.community")}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onChange({ community: e.target.value })
                }
              >
                <option value="">{i18next.t("curation-desk.filters.community-all")}</option>
                {communities.map((c) => (
                  <option key={c.community} value={c.community}>
                    {c.title || c.community}
                    {c.count != null ? ` (${c.count})` : ""}
                  </option>
                ))}
              </FormControl>
            </label>
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                on={filters.newAuthors}
                label={i18next.t("curation-desk.filters.new-authors")}
                onClick={() => onChange({ newAuthors: !filters.newAuthors })}
              />
              <ToggleChip
                on={filters.recommended}
                label={i18next.t("curation-desk.filters.recommended")}
                onClick={() => onChange({ recommended: !filters.recommended })}
              />
              {isRoster && (
                <ToggleChip
                  on={filters.flagged}
                  tone="red"
                  label={i18next.t("curation-desk.filters.flagged")}
                  onClick={() => onChange({ flagged: !filters.flagged })}
                />
              )}
              {isRoster && (
                <ToggleChip
                  on={filters.excluded}
                  label={i18next.t("curation-desk.filters.excluded")}
                  onClick={() => onChange({ excluded: !filters.excluded })}
                />
              )}
            </div>
          </fieldset>
          <fieldset className="min-w-0 space-y-3">
            <legend className="mb-3 font-semibold text-gray-600 dark:text-gray-400">
              {i18next.t("curation-desk.filters.content")}
            </legend>
            <label className="block space-y-1.5">
              <span>{i18next.t("curation-desk.filters.window")}</span>
              <FormControl
                type="select"
                size="sm"
                value={filters.window}
                aria-label={i18next.t("curation-desk.filters.window")}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onChange({ window: e.target.value as CurationWindow })
                }
              >
                {WINDOWS.map((w) => (
                  <option key={w} value={w}>
                    {i18next.t(`curation-desk.filters.window-${w}`)}
                  </option>
                ))}
              </FormControl>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block min-w-0 space-y-1.5">
                <span>{i18next.t("curation-desk.filters.words")}</span>
                <FormControl
                  type="select"
                  size="sm"
                  value={filters.minWords ?? ""}
                  aria-label={i18next.t("curation-desk.filters.words")}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    onChange({ minWords: e.target.value ? Number(e.target.value) : null })
                  }
                >
                  <option value="">{i18next.t("curation-desk.filters.words-any")}</option>
                  {WORD_PRESETS.map((n) => (
                    <option key={n} value={n}>
                      {i18next.t("curation-desk.filters.words-min", { count: n })}
                    </option>
                  ))}
                </FormControl>
              </label>
              <label className="block min-w-0 space-y-1.5">
                <span>{i18next.t("curation-desk.filters.words-max-label")}</span>
                <FormControl
                  type="select"
                  size="sm"
                  value={filters.maxWords ?? ""}
                  aria-label={i18next.t("curation-desk.filters.words-max-label")}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    onChange({ maxWords: e.target.value ? Number(e.target.value) : null })
                  }
                >
                  <option value="">{i18next.t("curation-desk.filters.words-any-max")}</option>
                  {WORD_PRESETS.map((n) => (
                    <option key={n} value={n}>
                      {i18next.t("curation-desk.filters.words-max", { count: n })}
                    </option>
                  ))}
                </FormControl>
              </label>
            </div>
            <ToggleChip
              on={filters.hasImages}
              label={i18next.t("curation-desk.filters.has-images")}
              onClick={() => onChange({ hasImages: !filters.hasImages })}
            />
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="mb-3 font-semibold text-gray-600 dark:text-gray-400">
              {i18next.t("curation-desk.filters.author-reputation")}
            </legend>
            <div className="flex flex-col gap-3 text-gray-600 dark:text-gray-400">
              <span>
                {i18next.t("curation-desk.filters.rep", {
                  min: filters.repMin,
                  max: filters.repMax
                })}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={filters.repMin}
                aria-label={i18next.t("curation-desk.filters.rep-min")}
                onChange={(e) =>
                  onChange({ repMin: Math.min(Number(e.target.value), filters.repMax) })
                }
                className="w-full accent-blue-dark-sky"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={filters.repMax}
                aria-label={i18next.t("curation-desk.filters.rep-max")}
                onChange={(e) =>
                  onChange({ repMax: Math.max(Number(e.target.value), filters.repMin) })
                }
                className="w-full accent-blue-dark-sky"
              />
            </div>
          </fieldset>
        </div>
      </details>
    </div>
  );
}

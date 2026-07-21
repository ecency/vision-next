"use client";

import { Button } from "@/features/ui";
import {
  UilLocationPoint,
  UilSearch,
  UilSpinner,
  UilTimesCircle
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useClickAway, useDebounce } from "react-use";
import { mergeSuggestions, searchGeocoder } from "./geo-search";
import { GeoLocation, GeoSuggestion } from "./geo-tag-types";
import { useCitiesSearch } from "./use-cities-search";

interface Props {
  /** Current address text, driven by the dialog (map clicks, detection, …). */
  value: string;
  geocoderHost: string;
  citiesUrl: string;
  detecting: boolean;
  onSelect: (location: GeoLocation) => void;
  onDetect: () => void;
}

const MIN_OFFLINE = 2;
const MIN_GEOCODER = 3;

function suggestionToAddress(s: GeoSuggestion): string {
  return [s.label, s.hint].filter(Boolean).join(", ");
}

export function PublishEditorGeoTagSearch({
  value,
  geocoderHost,
  citiesUrl,
  detecting,
  onSelect,
  onDetect
}: Props) {
  const { search } = useCitiesSearch(citiesUrl);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const swallowEscapeUpRef = useRef(false);

  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Geocoder rows tagged with the query they belong to, so a late response for
  // a stale query is never merged in.
  const [geo, setGeo] = useState<{ q: string; rows: GeoSuggestion[] }>({ q: "", rows: [] });

  const trimmed = query.trim();

  // Offline city search is cheap (pre-indexed) so it runs synchronously for
  // instant typeahead; only the geocoder fallback is debounced.
  const offlineResults = useMemo(
    () => (trimmed.length >= MIN_OFFLINE ? search(trimmed) : []),
    [trimmed, search]
  );

  const results = useMemo(
    () => mergeSuggestions(offlineResults, geo.q === trimmed ? geo.rows : []),
    [offlineResults, geo, trimmed]
  );

  // True from the moment the query changes until its geocoder lookup resolves.
  const busy = trimmed.length >= MIN_GEOCODER && geo.q !== trimmed;

  const showDropdown = open && trimmed.length >= MIN_OFFLINE;
  const showList = showDropdown && results.length > 0;
  const showEmpty = showDropdown && !busy && results.length === 0;

  // Focus the field when the dialog opens (the shared Modal doesn't move focus).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reflect externally-set addresses (map click / drag / detection) while the
  // user isn't actively typing in the field.
  useEffect(() => {
    if (!focusedRef.current) {
      setQuery(value ?? "");
    }
  }, [value]);

  useClickAway(rootRef, () => setOpen(false));

  // Keep the active row valid as results change (e.g. geocoder rows arriving
  // after an empty offline set — without this, Enter would select nothing).
  useEffect(() => {
    setActiveIndex((i) => {
      if (results.length === 0) return -1;
      if (i < 0) return 0;
      return Math.min(i, results.length - 1);
    });
  }, [results]);

  useDebounce(
    () => {
      abortRef.current?.abort();
      if (trimmed.length < MIN_GEOCODER) return;

      const controller = new AbortController();
      abortRef.current = controller;
      searchGeocoder(geocoderHost, trimmed, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) setGeo({ q: trimmed, rows });
        })
        .catch(() => {
          // Network/abort error: mark the query resolved (with no rows) so the
          // "searching" state clears and we fall back to the offline matches.
          if (!controller.signal.aborted) setGeo({ q: trimmed, rows: [] });
        });
    },
    300,
    [trimmed, geocoderHost]
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSelect = useCallback(
    (s: GeoSuggestion) => {
      const address = suggestionToAddress(s);
      setQuery(address);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      onSelect({ coordinates: { lat: s.lat, lng: s.lng }, address });
    },
    [onSelect]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        if (trimmed.length >= MIN_OFFLINE) setOpen(true);
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (results.length ? (i + 1) % results.length : -1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : -1));
          break;
        case "Enter":
          if (open && activeIndex >= 0 && results[activeIndex]) {
            e.preventDefault();
            handleSelect(results[activeIndex]);
          }
          break;
        case "Escape":
          if (open) {
            // First Escape collapses the dropdown only; swallow the matching
            // keyup so the shared Modal (which closes on keyup-Escape) stays
            // open. A second Escape then propagates and closes the dialog.
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
            swallowEscapeUpRef.current = true;
          }
          break;
      }
    },
    [open, results, activeIndex, handleSelect, trimmed]
  );

  const onKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && swallowEscapeUpRef.current) {
      e.stopPropagation();
      swallowEscapeUpRef.current = false;
    }
  }, []);

  const liveMessage = !showDropdown
    ? ""
    : busy
      ? i18next.t("publish.geo-tag.searching")
      : results.length
        ? i18next.t("publish.geo-tag.results-count", { count: results.length })
        : i18next.t("publish.geo-tag.no-results");

  const rightPad = busy ? "pr-14" : query.length > 0 ? "pr-9" : "pr-3";

  return (
    // Higher stacking context than the map so the dropdown always paints above
    // Leaflet's panes/controls — no z-index hacks on a global pac-container.
    <div ref={rootRef} className="relative z-[1000] mb-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative grow">
          <UilSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="geo-tag-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              showList && activeIndex >= 0 ? `geo-tag-suggestion-${activeIndex}` : undefined
            }
            className={`w-full rounded-xl border-2 border-gray-200 bg-white py-2.5 pl-10 ${rightPad} text-base text-gray-900 placeholder-gray-500 outline-none transition-colors duration-300 hover:border-gray-300 focus:border-blue-dark-sky dark:border-dark-600 dark:bg-dark-200 dark:text-white dark:placeholder-gray-400 dark:hover:border-dark-500 dark:focus:border-blue-dark-sky`}
            placeholder={i18next.t("publish.geo-tag.search-placeholder")}
            aria-label={i18next.t("publish.geo-tag.search-placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              focusedRef.current = true;
            }}
            onBlur={() => {
              focusedRef.current = false;
            }}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
          />
          {busy && (
            <UilSpinner className="absolute right-9 top-1/2 size-4 -translate-y-1/2 animate-spin text-blue-dark-sky" />
          )}
          {query.length > 0 && (
            <button
              type="button"
              aria-label={i18next.t("g.clear")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => {
                setQuery("");
                setGeo({ q: "", rows: [] });
                setOpen(false);
                inputRef.current?.focus();
              }}
            >
              <UilTimesCircle className="size-4" />
            </button>
          )}
        </div>

        <Button
          type="button"
          appearance="gray"
          outline={true}
          icon={<UilLocationPoint className="size-4" />}
          iconPlacement="left"
          isLoading={detecting}
          aria-busy={detecting}
          disabled={detecting}
          onClick={onDetect}
          className="shrink-0 whitespace-nowrap"
        >
          {detecting
            ? i18next.t("publish.geo-tag.detecting")
            : i18next.t("publish.geo-tag.detect-location")}
        </Button>
      </div>

      {/* Polite live region: announces search progress / counts to AT. */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      {showDropdown && (showList || busy || showEmpty) && (
        <div
          id="geo-tag-suggestions"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-200"
        >
          {showList && (
            <ul role="listbox">
              {results.map((s, i) => (
                <li
                  key={s.id}
                  id={`geo-tag-suggestion-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`flex cursor-pointer items-start gap-2 px-3 py-2 ${
                    i === activeIndex
                      ? "bg-blue-dark-sky-040 dark:bg-dark-300"
                      : "hover:bg-blue-dark-sky-040 dark:hover:bg-dark-300"
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    // keep focus / prevent input blur before the click registers
                    e.preventDefault();
                    handleSelect(s);
                  }}
                >
                  <UilLocationPoint className="mt-0.5 size-4 shrink-0 text-gray-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                      {s.label}
                    </span>
                    {s.hint && (
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {s.hint}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!showList && (busy || showEmpty) && (
            <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
              {busy
                ? i18next.t("publish.geo-tag.searching")
                : i18next.t("publish.geo-tag.no-results")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

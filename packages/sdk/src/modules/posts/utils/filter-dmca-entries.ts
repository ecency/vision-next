import { CONFIG } from "@/modules/core";
import { Entry } from "../types";

/**
 * Filters and censors entries that match DMCA patterns
 * @param entry - Single entry or array of entries to filter
 * @returns Filtered entry/entries with DMCA content censored.
 *          Note: Can return null/undefined if input is falsy - callers should guard against this.
 */
export function filterDmcaEntry(entry: Entry): Entry | null | undefined;
export function filterDmcaEntry(entries: Entry[]): Entry[];
export function filterDmcaEntry(entryOrEntries: Entry | Entry[] | null | undefined): Entry | Entry[] | null | undefined {
  if (Array.isArray(entryOrEntries)) {
    return entryOrEntries.map((entry) => applyFilter(entry));
  }
  return applyFilter(entryOrEntries);
}

function applyFilter(entry: Entry | null | undefined): Entry | null | undefined {
  if (!entry) return entry;

  const entryPath = `@${entry.author}/${entry.permlink}`;
  const isDmca =
    CONFIG.dmcaPatterns.includes(entryPath) ||
    CONFIG.dmcaPatternRegexes.some((regex) => regex.test(entryPath));

  if (isDmca) {
    return {
      ...entry,
      body: "This post is not available due to a copyright/fraudulent claim.",
      title: "",
    };
  }

  return entry;
}

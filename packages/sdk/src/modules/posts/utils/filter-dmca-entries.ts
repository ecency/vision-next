import { CONFIG } from "@/modules/core";
import { Entry } from "../types";

/**
 * Filters and censors entries that match DMCA patterns
 * @param entry - Single entry or array of entries to filter
 * @returns Filtered entry/entries with DMCA content censored
 */
export function filterDmcaEntry(entry: Entry): Entry;
export function filterDmcaEntry(entries: Entry[]): Entry[];
export function filterDmcaEntry(entryOrEntries: Entry | Entry[]): Entry | Entry[] {
  if (Array.isArray(entryOrEntries)) {
    return entryOrEntries.map((entry) => applyCensorship(entry));
  }
  return applyCensorship(entryOrEntries);
}

function applyCensorship(entry: Entry): Entry {
  if (!entry) return entry;

  const entryPath = `@${entry.author}/${entry.permlink}`;
  const isDmca = CONFIG.dmcaPatternRegexes.some((regex) => regex.test(entryPath));

  if (isDmca) {
    return {
      ...entry,
      body: "This post is not available due to a copyright/fraudulent claim.",
      title: "",
    };
  }

  return entry;
}

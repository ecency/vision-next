import type { CurationApp, CurationWindow } from "@ecency/sdk";

export const QUEUE_PAGE_SIZE = 25;
export const POLL_MS_CURATOR = 15_000;
export const POLL_MS_PUBLIC = 60_000;
/** One shared clock for every window badge; a countdown never re-renders a row. */
export const TICKER_MS = 60_000;
/** Snooze presets in hours, plus "tomorrow" (09:00 UTC). */
export const SNOOZE_PRESETS = [1, 3, 12, "tomorrow"] as const;
export type SnoozePreset = (typeof SNOOZE_PRESETS)[number];
/** No tick after this long without a curator action. */
export const IDLE_MS = 10 * 60_000;
/** A row materialized this long after `created` is "late" once it sits below the cursor. */
export const LATE_MS = 10 * 60_000;
/** Route 5 poll schedule after a recommend broadcast (seconds from the broadcast). */
export const RECOMMEND_POLL_AT_S = [5, 15, 30, 60] as const;
export const RECOMMEND_CONFIRM_DEADLINE_MS = 60_000;
/** Meta ping retry delays. */
export const META_RETRY_MS = [2_000, 10_000, 30_000] as const;
export const QUICK_VIEW_PREFETCH_DEBOUNCE_MS = 300;
/**
 * Recommenders listed in the badge popover. Each one loads its scorecard when
 * the popover opens, so the cap is what bounds the requests one open costs.
 */
export const POPOVER_RECOMMENDER_LIMIT = 5;
export const UNDO_REVIEWED_MS = 5_000;
export const SORT_STORAGE_KEY = "curation-desk-sort";
export const SEED_STORAGE_KEY = "curation-desk-seed";
/**
 * The saved refine set, per account: `{ v, users: { [username]: { filters } } }`.
 * The sort keeps its own key above and the seed is never persisted; see
 * SAVED_FILTER_FIELDS for why the rest of the panel is in or out.
 */
export const FILTERS_STORAGE_KEY = "curation-desk-filters";
export const SAVED_FILTERS_VERSION = 1;
export const MY_MARKS_KEY_SUFFIX = "my-marks";
/** Marks per page; the route answers a `next_cursor` while more remain. */
export const MY_MARKS_PAGE_SIZE = 50;
/**
 * Word count presets, offered as both a minimum and a maximum. 150 is there
 * for the photographers, artists and poets whose strong posts are short.
 */
export const WORD_PRESETS = [150, 300, 600, 1000] as const;
/**
 * The option lists the two selects render. They live here so the select and
 * the saved-filter validator can never drift apart.
 */
export const CURATION_APPS: CurationApp[] = ["all", "ecency", "peakd", "other"];
export const CURATION_WINDOWS: CurationWindow[] = ["all", "full", "half", "eighth", "locked"];
/** Vote is hidden under this payout scale-down factor (percent). */
export const LOCKED_VOTE_FLOOR_PCT = 25;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

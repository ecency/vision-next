import type { CurationApp } from "@ecency/sdk";
import * as ls from "@/utils/local-storage";
import { CURATION_APPS, FILTERS_STORAGE_KEY, SAVED_FILTERS_VERSION, WORD_PRESETS } from "./consts";
import type { QueueFilters, SavedFiltersStore, SavedQueueFilters } from "./types";

/**
 * The refine fields worth carrying between visits. Four are deliberately out:
 *
 * - `sort` keeps its own shipped key, so nobody's saved order is migrated.
 * - `seed` is session scoped: a stored one would freeze Random forever, and
 *   restoring `sort: random` before the seed exists sends `seed=""`, which the
 *   backend rejects.
 * - `window` selects by wall-clock age, so remembering it turns one afternoon's
 *   focus into a standing instruction to hide everything older than a day. It
 *   is also the field that switches off the half and eighth weight tails, so a
 *   restored one hides those posts with no way back on screen.
 * - `flagged` and `excluded` are moderation lenses, not a lane; `excluded`
 *   lists rows the public feed never serves.
 */
export const SAVED_FILTER_FIELDS = [
  "app",
  "community",
  "newAuthors",
  "recommended",
  "hideCurated",
  "unreviewedOnly",
  "minWords",
  "maxWords",
  "hasImages",
  "repMin",
  "repMax",
] as const;

/** Communities the backend accepts, so a restored value cannot 400 the feed. */
const COMMUNITY_RE = /^hive-\d{5,6}$/;

function isBool(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isRep(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
}

function isWordPreset(value: unknown): value is number {
  return typeof value === "number" && (WORD_PRESETS as readonly number[]).includes(value);
}

/**
 * Narrow one untrusted record. A bad field is dropped on its own, never the
 * whole set: a curator with one stale value keeps the rest of their lane.
 */
export function sanitizeSavedFilters(raw: unknown): SavedQueueFilters {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const out: SavedQueueFilters = {};

  if (typeof input.app === "string" && (CURATION_APPS as readonly string[]).includes(input.app)) {
    out.app = input.app as CurationApp;
  }
  if (typeof input.community === "string" && COMMUNITY_RE.test(input.community)) {
    out.community = input.community;
  }
  if (isBool(input.newAuthors)) out.newAuthors = input.newAuthors;
  if (isBool(input.recommended)) out.recommended = input.recommended;
  if (isBool(input.hideCurated)) out.hideCurated = input.hideCurated;
  if (isBool(input.unreviewedOnly)) out.unreviewedOnly = input.unreviewedOnly;
  if (isBool(input.hasImages)) out.hasImages = input.hasImages;

  // The two word selects do not clamp each other, so an inverted pair is
  // reachable. It matches nothing on the server, so it is dropped whole
  // rather than persisted as a queue that is always empty.
  const min = isWordPreset(input.minWords) ? input.minWords : null;
  const max = isWordPreset(input.maxWords) ? input.maxWords : null;
  if (!(min != null && max != null && min > max)) {
    if (min != null) out.minWords = min;
    if (max != null) out.maxWords = max;
  }

  // The reputation range is one control, so it restores as a pair or not at all.
  if (isRep(input.repMin) && isRep(input.repMax) && input.repMin <= input.repMax) {
    out.repMin = input.repMin;
    out.repMax = input.repMax;
  }
  return out;
}

/**
 * The account the saved set belongs to. `useActiveUsername` is undefined until
 * the store's own mount effect runs, so the same value the store reads is read
 * here directly; otherwise the first restore would miss and the desk would
 * fetch page one twice.
 */
export function readStoredUsername(): string | null {
  const stored = ls.get("active_user");
  return typeof stored === "string" && stored ? stored : null;
}

function readStore(): SavedFiltersStore {
  const raw = ls.get(FILTERS_STORAGE_KEY);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { v: SAVED_FILTERS_VERSION, users: {} };
  const store = raw as Partial<SavedFiltersStore>;
  if (store.v !== SAVED_FILTERS_VERSION) return { v: SAVED_FILTERS_VERSION, users: {} };
  const users = store.users;
  if (!users || typeof users !== "object" || Array.isArray(users)) {
    return { v: SAVED_FILTERS_VERSION, users: {} };
  }
  return { v: SAVED_FILTERS_VERSION, users: users as SavedFiltersStore["users"] };
}

export function readSavedFilters(owner: string | null): SavedQueueFilters {
  if (!owner) return {};
  try {
    return sanitizeSavedFilters(readStore().users[owner]?.filters);
  } catch {
    // Storage may be unavailable; the desk simply opens on the defaults.
    return {};
  }
}

/**
 * Only the fields that differ from the role's own defaults are stored, so the
 * `unreviewedOnly: null` sentinel survives as an absent key. A member later
 * added to the roster therefore still resolves the roster defaults instead of
 * a value frozen from when they were not on it.
 */
export function pickSavedFilters(
  filters: QueueFilters,
  defaults: QueueFilters,
  isRoster: boolean
): SavedQueueFilters {
  const out: SavedQueueFilters = {};
  for (const key of SAVED_FILTER_FIELDS) {
    if (key === "unreviewedOnly") continue;
    const value = filters[key];
    if (value !== defaults[key] && value != null) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  // `unreviewedOnly` is nullable and resolves from the role, so it is compared
  // the way resolveFilters and countActiveFilters compare it. Toggling the chip
  // off and on again lands on `true`, which is the roster default: without this
  // the desk would report a saved filter that nothing else counts.
  const resolved = filters.unreviewedOnly ?? isRoster;
  if (resolved !== (defaults.unreviewedOnly ?? isRoster)) out.unreviewedOnly = resolved;
  // The range is one filter in the badge and in Reset, so it is one here too.
  if (out.repMin != null || out.repMax != null) {
    out.repMin = filters.repMin;
    out.repMax = filters.repMax;
  }
  return out;
}

/** Writes the account's set, and removes the entry (and the key) when empty. */
export function saveFilters(owner: string | null, filters: SavedQueueFilters): void {
  if (!owner) return;
  try {
    const store = readStore();
    if (Object.keys(filters).length === 0) {
      if (!store.users[owner]) return;
      delete store.users[owner];
      if (Object.keys(store.users).length === 0) ls.remove(FILTERS_STORAGE_KEY);
      else ls.set(FILTERS_STORAGE_KEY, store);
      return;
    }
    store.users[owner] = { filters };
    ls.set(FILTERS_STORAGE_KEY, store);
  } catch {
    // Quota or private mode: the choice still applies for this visit.
  }
}

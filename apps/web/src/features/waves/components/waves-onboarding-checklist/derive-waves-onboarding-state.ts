import type { QuestsResponse } from "@ecency/sdk";

import { PREFIX } from "@/utils/local-storage";

export type WavesOnboardingItemId = "wave" | "vote" | "reply" | "checkin";

/**
 * Window event fired when the submit path latches an onboarding item. On chain a
 * wave — and a reply to a wave — is comment activity, so the quests endpoint
 * cannot tell a posted wave from a reply: the submit path is the only reliable
 * signal for the `wave` and `reply` items. The event carries the submitting
 * `username` so a checklist mounted for a different account (e.g. after an
 * account switch) ignores it; the submitting account is persisted directly
 * regardless (see latchWavesOnboardingItem).
 */
export const WAVES_ONBOARDING_LATCH_EVENT = "ecency-waves-onboarding-latch";

export interface WavesOnboardingLatchDetail {
  username: string;
  id: WavesOnboardingItemId;
}

/** localStorage key the checklist latches per-user completions under. Must stay
 * in sync with the key used by the checklist component's useSynchronizedLocalStorage. */
function onboardingDoneStorageKey(username: string): string {
  return `${PREFIX}_waves_onboarding_done_${username}`;
}

/**
 * Complete an onboarding item for a specific account from the submit path.
 *
 * The completion is persisted straight to the *submitting* account's localStorage
 * key — passed in by the caller, not read from whatever account is active when an
 * async submit resolves. This makes the latch reliable in the two cases the old
 * fire-and-forget window event dropped: a wave posted from a page where the
 * checklist is not mounted (no listener to catch the event), and a submit that
 * resolves after the user switches accounts (the event would have marked the new
 * account). A scoped event still lets a checklist mounted for that same user tick
 * the item live.
 */
export function latchWavesOnboardingItem(username: string, id: WavesOnboardingItemId) {
  if (typeof window === "undefined" || !username) {
    return;
  }

  const key = onboardingDoneStorageKey(username);
  let current: WavesOnboardingItemId[] = [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      current = parsed;
    }
  } catch {
    current = [];
  }

  if (!current.includes(id)) {
    try {
      window.localStorage.setItem(key, JSON.stringify([...current, id]));
    } catch {
      // Ignore storage quota/availability failures; a mounted checklist still
      // ticks via the event below, and re-derivation re-latches on the next load.
    }
  }

  window.dispatchEvent(
    new CustomEvent<WavesOnboardingLatchDetail>(WAVES_ONBOARDING_LATCH_EVENT, {
      detail: { username, id }
    })
  );
}

export interface WavesOnboardingItem {
  id: WavesOnboardingItemId;
  completed: boolean;
}

export interface WavesOnboardingState {
  /** the account is fresh enough (or quiet enough) to be nudged */
  eligible: boolean;
  items: WavesOnboardingItem[];
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
}

const NEW_ACCOUNT_WINDOW_DAYS = 30;
const NEW_ACCOUNT_MAX_POSTS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function dailyProgress(quests: QuestsResponse, id: string): number {
  return quests.daily?.find((q) => q.id === id)?.progress ?? 0;
}

export function isNewAccount(
  account: { created: string; post_count: number },
  now = Date.now()
): boolean {
  // Hive timestamps come without a timezone marker but are UTC.
  const created = account.created;
  const createdAt = Date.parse(created.indexOf("Z") === -1 ? `${created}Z` : created);
  const withinWindow =
    Number.isFinite(createdAt) && now - createdAt <= NEW_ACCOUNT_WINDOW_DAYS * DAY_MS;
  return withinWindow || account.post_count < NEW_ACCOUNT_MAX_POSTS;
}

/**
 * Pure derivation of the waves onboarding checklist from the `/private-api/quests`
 * response + account freshness. Daily quest progress resets at 00:00 UTC, so the
 * caller passes completions it already latched to localStorage — a checklist item
 * must never un-check itself the next day. Returns null until both inputs arrive
 * so callers can distinguish "loading" from "nothing to show".
 */
export function deriveWavesOnboardingState(
  quests: QuestsResponse | undefined,
  account: { created: string; post_count: number } | null | undefined,
  persistedCompleted: WavesOnboardingItemId[] = [],
  now = Date.now()
): WavesOnboardingState | null {
  // Tolerate a truthy-but-partial account object; treat it as still loading.
  if (!quests || typeof account?.created !== "string" || typeof account?.post_count !== "number") {
    return null;
  }

  const item = (id: WavesOnboardingItemId, liveComplete: boolean): WavesOnboardingItem => ({
    id,
    completed: liveComplete || persistedCompleted.includes(id)
  });

  const streak = quests.streak?.current ?? 0;
  const items = [
    // No live quest signal for either item: on chain a wave and a reply are both
    // comment activity, so the `comment` daily quest cannot tell them apart — a
    // user's very first wave would otherwise also complete "reply" without them
    // ever replying. Both complete only via the submit-path latch (see
    // latchWavesOnboardingItem).
    item("wave", false),
    item("vote", dailyProgress(quests, "vote") > 0),
    item("reply", false),
    item("checkin", dailyProgress(quests, "checkin") > 0 || streak >= 1)
  ];

  const completedCount = items.filter((i) => i.completed).length;

  return {
    eligible: isNewAccount(account, now),
    items,
    completedCount,
    totalCount: items.length,
    allComplete: completedCount === items.length
  };
}

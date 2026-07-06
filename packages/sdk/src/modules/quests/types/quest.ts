/**
 * Daily/weekly/monthly quest tracker shapes returned by `/private-api/quests`.
 * The endpoint is read-only: it aggregates the user's existing, already-rewarded
 * point activity. It mints nothing.
 */

export interface QuestMilestone {
  /** rolling progress toward the next milestone (e.g. check-ins since the last bonus) */
  progress: number;
  /** milestone threshold (e.g. EXTRA_CHECKIN_FOR = 48) */
  at: number;
  /** points awarded when the milestone is reached */
  reward: number;
}

export interface DailyCheckinQuest {
  id: "checkin";
  /** check-ins recorded today */
  progress: number;
  /** points per check-in */
  reward_each: number;
  milestone: QuestMilestone;
}

export interface DailyContentQuest {
  id: "post" | "comment" | "vote" | "reblog";
  /** actions of this type pointed today */
  progress: number;
  /** soft daily cap — action count at which the existing reward decays to ~0 */
  cap: number;
}

export type DailyQuest = DailyCheckinQuest | DailyContentQuest;

export interface PeriodQuest {
  id: string;
  progress: number;
}

export interface QuestStreak {
  current: number;
  best: number;
  /** today has no check-in yet but a streak is active — nudge the user */
  at_risk: boolean;
  /**
   * Unused streak freezes the user holds (auto-consumed to protect a missed day).
   * Optional: absent on quests responses cached before this field shipped.
   */
  freezes_owned?: number;
}

/** Result of buying a streak freeze (`/private-api/streak-freeze/buy`). */
export interface StreakFreezeBuyResult {
  /** freezes owned after the purchase */
  owned: number;
  /** the user's Points balance after the debit */
  points: number;
}

export interface QuestPeriod {
  /** ISO date (UTC) of the current daily window */
  day: string;
  /** ISO week id, e.g. "2026-W21" */
  week: string;
  /** "YYYY-MM" */
  month: string;
  /** seconds until the daily window resets (next 00:00 UTC) */
  day_resets_in_secs: number;
}

export interface QuestsResponse {
  period: QuestPeriod;
  daily: DailyQuest[];
  weekly: PeriodQuest[];
  monthly: PeriodQuest[];
  streak: QuestStreak;
}

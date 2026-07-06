import { getQuestCatalogEntry, type QuestsResponse } from "@ecency/sdk";

export interface QuestChipState {
  /** show the chip at all — an active streak to protect or a daily post still to publish */
  visible: boolean;
  /** the daily post quest reached its catalog goal today */
  postedToday: boolean;
  postProgress: number;
  postGoal: number;
  /** current streak length in days */
  streak: number;
  /** streak is active but today has no qualifying activity yet */
  atRisk: boolean;
}

/**
 * Pure derivation of the composer quest chip from the `/private-api/quests`
 * response. Returns null until data arrives so callers can distinguish
 * "loading" from "nothing to show" (`visible: false`).
 */
export function deriveQuestChipState(quests: QuestsResponse | undefined): QuestChipState | null {
  if (!quests) {
    return null;
  }

  const postQuest = quests.daily?.find((q) => q.id === "post");
  const postGoal = getQuestCatalogEntry("daily", "post")?.goal ?? 1;
  const postProgress = postQuest?.progress ?? 0;
  const postedToday = postProgress >= postGoal;

  const streak = quests.streak?.current ?? 0;
  const atRisk = (quests.streak?.at_risk ?? false) && streak > 0;

  return {
    visible: streak > 0 || !postedToday,
    postedToday,
    postProgress,
    postGoal,
    streak,
    atRisk
  };
}

import { vi } from "vitest";
import type { QuestsResponse } from "@ecency/sdk";

vi.mock("@ecency/sdk", () => ({
  // Minimal mirror of the SDK quest catalog — only the entry the helper reads.
  getQuestCatalogEntry: (tier: string, id: string) =>
    tier === "daily" && id === "post"
      ? { id: "post", tier: "daily", goal: 1, i18nKey: "post", icon: "pencil" }
      : undefined
}));

import { deriveQuestChipState } from "@/features/shared/quest-streak-chip/derive-quest-chip-state";

function makeQuests(overrides: {
  postProgress?: number;
  includePostQuest?: boolean;
  streak?: Partial<QuestsResponse["streak"]>;
}): QuestsResponse {
  const { postProgress = 0, includePostQuest = true, streak } = overrides;
  return {
    period: { day: "2026-07-06", week: "2026-W28", month: "2026-07", day_resets_in_secs: 3600 },
    daily: includePostQuest ? [{ id: "post", progress: postProgress, cap: 3 }] : [],
    weekly: [],
    monthly: [],
    streak: { current: 0, best: 0, at_risk: false, ...streak }
  };
}

describe("deriveQuestChipState", () => {
  it("returns null while the quests query has no data yet", () => {
    expect(deriveQuestChipState(undefined)).toBeNull();
  });

  it("is visible with post progress when the daily post is incomplete and no streak exists", () => {
    const state = deriveQuestChipState(makeQuests({ postProgress: 0 }));
    expect(state).toEqual({
      visible: true,
      postedToday: false,
      postProgress: 0,
      postGoal: 1,
      streak: 0,
      atRisk: false
    });
  });

  it("stays visible for the streak flame once the daily post is complete", () => {
    const state = deriveQuestChipState(
      makeQuests({ postProgress: 1, streak: { current: 5, best: 9 } })
    );
    expect(state).toMatchObject({ visible: true, postedToday: true, streak: 5 });
  });

  it("hides entirely when the daily post is done and there is no streak to show", () => {
    const state = deriveQuestChipState(makeQuests({ postProgress: 1 }));
    expect(state).toMatchObject({ visible: false, postedToday: true, streak: 0 });
  });

  it("treats progress beyond the catalog goal as complete", () => {
    const state = deriveQuestChipState(makeQuests({ postProgress: 3 }));
    expect(state).toMatchObject({ postedToday: true, postProgress: 3, postGoal: 1 });
  });

  it("treats a missing daily post quest as zero progress", () => {
    const state = deriveQuestChipState(makeQuests({ includePostQuest: false }));
    expect(state).toMatchObject({ visible: true, postedToday: false, postProgress: 0 });
  });

  it("flags at-risk only while a streak is actually active", () => {
    const active = deriveQuestChipState(
      makeQuests({ streak: { current: 3, best: 3, at_risk: true } })
    );
    expect(active).toMatchObject({ atRisk: true });

    const inactive = deriveQuestChipState(makeQuests({ streak: { at_risk: true } }));
    expect(inactive).toMatchObject({ atRisk: false });
  });
});

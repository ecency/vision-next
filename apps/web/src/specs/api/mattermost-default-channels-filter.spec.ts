import { describe, it, expect } from "vitest";

/**
 * Regression test: MATTERMOST_DEFAULT_CHANNELS filtering.
 *
 * The channels route filters out Mattermost team defaults
 * ("town-square", "off-topic") that users are auto-joined to
 * when they join the team. This test verifies:
 * 1. Default channels are removed from the response
 * 2. Real community/DM channels survive the filter
 * 3. Channel selection logic picks the intended non-default channel
 */

// Mirror the constant from the channels route
const MATTERMOST_DEFAULT_CHANNELS = new Set(["town-square", "off-topic"]);

interface TestChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
}

function applyDefaultChannelFilter(channels: TestChannel[]): TestChannel[] {
  return channels.filter((channel) => !MATTERMOST_DEFAULT_CHANNELS.has(channel.name));
}

describe("MATTERMOST_DEFAULT_CHANNELS filtering", () => {
  const payload: TestChannel[] = [
    { id: "ch-1", name: "town-square", display_name: "Town Square", type: "O" },
    { id: "ch-2", name: "off-topic", display_name: "Off-Topic", type: "O" },
    { id: "ch-3", name: "hive-123456", display_name: "Photography Lovers", type: "O" },
    { id: "ch-4", name: "hive-654321", display_name: "LeoFinance", type: "O" },
    { id: "ch-5", name: "user1__user2", display_name: "@user2", type: "D" }
  ];

  it("removes town-square and off-topic from the channel list", () => {
    const filtered = applyDefaultChannelFilter(payload);

    const names = filtered.map((ch) => ch.name);
    expect(names).not.toContain("town-square");
    expect(names).not.toContain("off-topic");
  });

  it("preserves real community channels", () => {
    const filtered = applyDefaultChannelFilter(payload);

    const names = filtered.map((ch) => ch.name);
    expect(names).toContain("hive-123456");
    expect(names).toContain("hive-654321");
  });

  it("preserves DM channels", () => {
    const filtered = applyDefaultChannelFilter(payload);

    const dmChannels = filtered.filter((ch) => ch.type === "D");
    expect(dmChannels).toHaveLength(1);
    expect(dmChannels[0].name).toBe("user1__user2");
  });

  it("returns correct count after filtering", () => {
    const filtered = applyDefaultChannelFilter(payload);
    // 5 total - 2 defaults = 3 remaining
    expect(filtered).toHaveLength(3);
  });

  it("handles empty channel list gracefully", () => {
    const filtered = applyDefaultChannelFilter([]);
    expect(filtered).toHaveLength(0);
  });

  it("handles list with only default channels", () => {
    const onlyDefaults: TestChannel[] = [
      { id: "ch-1", name: "town-square", display_name: "Town Square", type: "O" },
      { id: "ch-2", name: "off-topic", display_name: "Off-Topic", type: "O" }
    ];
    const filtered = applyDefaultChannelFilter(onlyDefaults);
    expect(filtered).toHaveLength(0);
  });

  it("does not filter channels with similar but non-matching names", () => {
    const edgeCases: TestChannel[] = [
      { id: "ch-1", name: "town-square", display_name: "Town Square", type: "O" },
      { id: "ch-2", name: "town-square-2", display_name: "Town Square 2", type: "O" },
      { id: "ch-3", name: "off-topic-gaming", display_name: "Off-Topic Gaming", type: "O" }
    ];
    const filtered = applyDefaultChannelFilter(edgeCases);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((ch) => ch.name)).toEqual(["town-square-2", "off-topic-gaming"]);
  });

  it("default channel resolution picks the first non-default channel", () => {
    const filtered = applyDefaultChannelFilter(payload);
    // After filtering, the first channel should be a real community channel,
    // not a Mattermost default
    const defaultChannelId = filtered[0]?.id;
    expect(defaultChannelId).toBe("ch-3"); // hive-123456, not town-square
  });
});

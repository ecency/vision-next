import { describe, it, expect, vi } from "vitest";

// The global @/utils mock only exposes random + getAccessToken; the helper needs
// the real parseAsset to sum the payout strings carried by feed entries.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

import { deriveOptimisticVote } from "@/api/mutations/derive-optimistic-vote";
import { Entry } from "@/entities";

const UP = 10000;

// A lightweight unified-waves-feed row: a net_votes count, payout strings, and
// NO active_votes array / stats object (this is what regressed the optimistic
// update).
function feedWave(overrides: Partial<Entry> = {}): Entry {
  return {
    author: "alice",
    permlink: "wave-1",
    net_votes: 5,
    pending_payout_value: "0.000 HBD",
    author_payout_value: "0.000 HBD",
    curator_payout_value: "0.000 HBD",
    ...overrides
  } as Entry;
}

// A full RPC entry: active_votes + numeric payout.
function fullEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    author: "alice",
    permlink: "post-1",
    active_votes: [
      { voter: "bob", rshares: 100 },
      { voter: "carol", rshares: 200 }
    ],
    stats: { total_votes: 2, flag_weight: 0, gray: false, hide: false },
    payout: 3,
    pending_payout_value: "3.000 HBD",
    author_payout_value: "0.000 HBD",
    curator_payout_value: "0.000 HBD",
    ...overrides
  } as Entry;
}

describe("deriveOptimisticVote", () => {
  // Regression: feed waves carry no active_votes, so the optimistic count/payout
  // bump used to be skipped entirely. It must now increment net_votes and payout.
  it("increments count and payout for a feed wave with no active_votes", () => {
    const { newVotes, nextVoteCount, nextPayout } = deriveOptimisticVote(
      feedWave(),
      UP,
      0.012,
      "dave"
    );

    expect(nextVoteCount).toBe(6); // net_votes 5 -> 6
    expect(nextPayout).toBeCloseTo(0.012, 6); // 0 summed strings + estimated
    expect(newVotes).toEqual([{ rshares: UP, voter: "dave" }]);
  });

  it("sums the existing payout strings of a feed wave as the base payout", () => {
    const { nextPayout } = deriveOptimisticVote(
      feedWave({ pending_payout_value: "1.500 HBD" }),
      UP,
      0.25,
      "dave"
    );
    expect(nextPayout).toBeCloseTo(1.75, 6);
  });

  it("adds the voter and bumps count/payout for a full entry", () => {
    const { newVotes, nextVoteCount, nextPayout } = deriveOptimisticVote(
      fullEntry(),
      UP,
      0.5,
      "dave"
    );

    expect(nextVoteCount).toBe(3); // 2 -> 3
    expect(newVotes).toHaveLength(3);
    expect(newVotes).toContainEqual({ rshares: UP, voter: "dave" });
    expect(nextPayout).toBeCloseTo(3.5, 6); // numeric payout 3 + estimated
  });

  it("does not double-count when the user re-votes (already voted)", () => {
    const { newVotes, nextVoteCount } = deriveOptimisticVote(fullEntry(), UP, 0.1, "bob");

    expect(nextVoteCount).toBe(2); // unchanged
    expect(newVotes).toHaveLength(2);
    expect(newVotes.filter((v) => v.voter === "bob")).toHaveLength(1);
    expect(newVotes).toContainEqual({ rshares: UP, voter: "bob" });
  });

  it("decrements count and drops the voter when removing a vote (weight 0)", () => {
    const { newVotes, nextVoteCount } = deriveOptimisticVote(fullEntry(), 0, 0, "bob");

    expect(nextVoteCount).toBe(1); // 2 -> 1
    expect(newVotes).toHaveLength(1);
    expect(newVotes.some((v) => v.voter === "bob")).toBe(false);
  });

  it("leaves count unchanged when removing a vote on a feed wave (unknown prior vote)", () => {
    const { nextVoteCount } = deriveOptimisticVote(feedWave(), 0, 0, "dave");
    expect(nextVoteCount).toBe(5); // can't decrement without an active_votes list
  });
});

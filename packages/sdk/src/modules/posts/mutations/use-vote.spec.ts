import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { applyVoteCacheUpdate, isVoteAlreadyReflected } from "./use-vote";

describe("isVoteAlreadyReflected", () => {
  const votes = [{ voter: "alice" }, { voter: "bob" }];

  it("is false for a fresh vote when the voter is not in active_votes", () => {
    expect(isVoteAlreadyReflected(votes, "carol", 10000)).toBe(false);
  });

  it("is true for a vote when the voter is already in active_votes (platform optimistic layer applied it)", () => {
    expect(isVoteAlreadyReflected(votes, "alice", 10000)).toBe(true);
  });

  it("is true for a downvote when the voter is already in active_votes", () => {
    expect(isVoteAlreadyReflected(votes, "alice", -10000)).toBe(true);
  });

  it("is false for an unvote when the voter is still in active_votes", () => {
    expect(isVoteAlreadyReflected(votes, "bob", 0)).toBe(false);
  });

  it("is true for an unvote when the voter is already removed", () => {
    expect(isVoteAlreadyReflected(votes, "carol", 0)).toBe(true);
  });

  it("is false for a fresh vote on an entry with no votes yet", () => {
    expect(isVoteAlreadyReflected([], "carol", 10000)).toBe(false);
  });
});

describe("applyVoteCacheUpdate", () => {
  const entryKey = ["posts", "entry", "/@alice/my-post"];

  const seedEntry = (activeVotes: Array<{ voter: string; rshares: number }>) => {
    const qc = new QueryClient();
    const entry = {
      author: "alice",
      permlink: "my-post",
      payout: 1,
      active_votes: activeVotes,
      stats: { gray: false, hide: false, flag_weight: 0, total_votes: activeVotes.length },
    };
    qc.setQueryData(entryKey, entry);
    return { qc, entry };
  };

  it("applies votes and payout for a fresh vote (voter not in active_votes)", () => {
    const { qc } = seedEntry([{ voter: "bob", rshares: 100 }]);

    applyVoteCacheUpdate("carol", { author: "alice", permlink: "my-post", weight: 10000, estimated: 2 }, qc);

    const updated = qc.getQueryData<any>(entryKey);
    expect(updated.active_votes).toEqual([
      { voter: "bob", rshares: 100 },
      { rshares: 10000, voter: "carol" },
    ]);
    expect(updated.payout).toBe(3);
    expect(updated.total_votes).toBe(2);
  });

  it("skips the write when the voter is already in active_votes (platform layer applied it)", () => {
    const { qc, entry } = seedEntry([{ voter: "carol", rshares: 100 }]);

    applyVoteCacheUpdate("carol", { author: "alice", permlink: "my-post", weight: 10000, estimated: 2 }, qc);

    // Same object reference: no cache write happened at all.
    expect(qc.getQueryData(entryKey)).toBe(entry);
  });

  it("applies an unvote when the voter is still in active_votes", () => {
    const { qc } = seedEntry([
      { voter: "bob", rshares: 100 },
      { voter: "carol", rshares: 200 },
    ]);

    applyVoteCacheUpdate("carol", { author: "alice", permlink: "my-post", weight: 0, estimated: 0 }, qc);

    const updated = qc.getQueryData<any>(entryKey);
    expect(updated.active_votes).toEqual([{ voter: "bob", rshares: 100 }]);
    expect(updated.total_votes).toBe(1);
  });

  it("skips the write for an unvote when the voter is already removed", () => {
    const { qc, entry } = seedEntry([{ voter: "bob", rshares: 100 }]);

    applyVoteCacheUpdate("carol", { author: "alice", permlink: "my-post", weight: 0, estimated: 0 }, qc);

    expect(qc.getQueryData(entryKey)).toBe(entry);
  });

  it("does nothing when the entry is not cached or lacks active_votes", () => {
    const qc = new QueryClient();
    expect(() =>
      applyVoteCacheUpdate("carol", { author: "alice", permlink: "my-post", weight: 10000 }, qc)
    ).not.toThrow();
    expect(qc.getQueryData(entryKey)).toBeUndefined();

    qc.setQueryData(entryKey, { author: "alice", permlink: "my-post", payout: 1 });
    const before = qc.getQueryData(entryKey);
    applyVoteCacheUpdate("carol", { author: "alice", permlink: "my-post", weight: 10000 }, qc);
    expect(qc.getQueryData(entryKey)).toBe(before);
  });
});

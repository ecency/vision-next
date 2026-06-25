import { Entry, EntryVote } from "@/entities";
import { parseAsset } from "@/utils";

export interface OptimisticVote {
  newVotes: EntryVote[];
  nextVoteCount: number;
  nextPayout: number;
}

/**
 * Compute the optimistic vote state for an entry after `username` casts a vote
 * of `weight` (0 removes the vote) with an `estimated` payout delta.
 *
 * Robust to lightweight feed entries (the unified waves feed) that ship a
 * `net_votes` count but no `active_votes` array: the count is derived from
 * whichever vote-count field the entry carries, and the base payout from the
 * numeric `payout` (full RPC entries) or the summed payout strings (feed
 * entries), so the count and payout still move immediately on vote rather than
 * waiting for a refetch.
 */
export function deriveOptimisticVote(
  entry: Entry,
  weight: number,
  estimated: number,
  username: string
): OptimisticVote {
  const existingVotes = entry.active_votes ?? [];
  const alreadyVoted = existingVotes.some((v) => v.voter === username);

  const newVotes: EntryVote[] = [
    ...existingVotes.filter((v) => v.voter !== username),
    ...(weight !== 0 ? [{ rshares: weight, voter: username }] : [])
  ];

  const baseVoteCount =
    entry.stats?.total_votes ||
    existingVotes.length ||
    entry.net_votes ||
    entry.total_votes ||
    0;
  let nextVoteCount = baseVoteCount;
  if (weight !== 0 && !alreadyVoted) {
    nextVoteCount = baseVoteCount + 1;
  } else if (weight === 0 && alreadyVoted) {
    nextVoteCount = Math.max(0, baseVoteCount - 1);
  }

  const basePayout =
    typeof entry.payout === "number"
      ? entry.payout
      : parseAsset(entry.pending_payout_value).amount +
        parseAsset(entry.author_payout_value).amount +
        parseAsset(entry.curator_payout_value).amount;

  return { newVotes, nextVoteCount, nextPayout: basePayout + estimated };
}

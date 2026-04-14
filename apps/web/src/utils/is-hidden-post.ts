const HIDDEN_POST_RSHARES_THRESHOLD = -10000000000;
const HIDDEN_POST_MIN_VOTES = 3;

export function isHiddenPost(
  netRshares: number | undefined,
  activeVotesLength: number
): boolean {
  return (netRshares ?? 0) < HIDDEN_POST_RSHARES_THRESHOLD && activeVotesLength > HIDDEN_POST_MIN_VOTES;
}

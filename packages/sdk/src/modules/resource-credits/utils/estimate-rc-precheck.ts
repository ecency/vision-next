import { calculateRCMana } from "@/modules/core/hive-tx";
import type { RCAccount } from "@/modules/core/hive-tx";
import type { RcStats } from "../types/stats";

/**
 * Operations the RC pre-check can estimate. Mirrors the keys exposed by
 * `rc_api.get_rc_stats` (see {@link RcStats}["ops"]).
 */
export type RcPrecheckOperation = keyof RcStats["ops"];

export interface RcPrecheckInput {
  /** From `getAccountRcQueryOptions(username)` -> rcAccounts[0]. */
  rcAccount: RCAccount | null | undefined;
  /** From `getRcStatsQueryOptions()`. */
  rcStats: RcStats | null | undefined;
  /** The operation the user is about to broadcast. */
  operation: RcPrecheckOperation;
  /**
   * Safety multiplier applied to the average operation cost when deciding
   * whether the broadcast will "likely fail". Actual on-chain cost varies with
   * network load, so we keep headroom. Defaults to 1.2.
   */
  buffer?: number;
}

export interface RcPrecheckResult {
  /** Both inputs were available, so the estimate is meaningful. */
  ready: boolean;
  /** Current RC mana of the account. */
  currentMana: number;
  /** Maximum RC mana of the account. */
  maxMana: number;
  /** Average RC cost of the operation. */
  avgCost: number;
  /** Average cost padded by `buffer`. */
  estimatedCost: number;
  /** `currentMana` is below the padded estimate -> broadcast likely fails. */
  willLikelyFail: boolean;
  /** RC shortfall vs the padded estimate (0 when not failing). */
  deficit: number;
  /** Roughly how many such operations the account can still afford. */
  remaining: number;
}

const EMPTY: RcPrecheckResult = {
  ready: false,
  currentMana: 0,
  maxMana: 0,
  avgCost: 0,
  estimatedCost: 0,
  willLikelyFail: false,
  deficit: 0,
  remaining: 0,
};

/**
 * Pure, client-side estimate of whether an account has enough Resource Credits
 * to broadcast an operation, used to warn the user BEFORE they submit instead
 * of failing afterwards with the chain's "Please wait to transact" error.
 *
 * It is intentionally approximate: it uses the network-wide average cost from
 * `rc_api.get_rc_stats`, padded by a buffer. Treat `willLikelyFail` as a hint,
 * never a hard gate - the publish/comment/vote action must stay non-blocking.
 */
export function estimateRcPrecheck({
  rcAccount,
  rcStats,
  operation,
  buffer = 1.2,
}: RcPrecheckInput): RcPrecheckResult {
  if (!rcAccount || !rcStats?.ops) {
    return EMPTY;
  }

  const { current_mana: currentMana, max_mana: maxMana } = calculateRCMana(rcAccount);
  const avgCost = Number(rcStats.ops[operation]?.avg_cost ?? 0);

  if (!(avgCost > 0)) {
    return { ...EMPTY, ready: true, currentMana, maxMana };
  }

  const estimatedCost = avgCost * buffer;
  const willLikelyFail = currentMana < estimatedCost;

  return {
    ready: true,
    currentMana,
    maxMana,
    avgCost,
    estimatedCost,
    willLikelyFail,
    deficit: willLikelyFail ? Math.ceil(estimatedCost - currentMana) : 0,
    remaining: Math.floor(currentMana / avgCost),
  };
}

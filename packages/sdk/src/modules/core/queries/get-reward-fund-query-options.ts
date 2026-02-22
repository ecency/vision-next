import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "../config";
import { QueryKeys } from "@/modules/core";

export interface RewardFund {
  id: number;
  name: string;
  reward_balance: string;
  recent_claims: string;
  last_update: string;
  content_constant: string;
  percent_curation_rewards: number;
  percent_content_rewards: number;
  author_reward_curve: string;
  curation_reward_curve: string;
}

/**
 * Get reward fund information from the blockchain
 * @param fundName - Name of the reward fund (default: 'post')
 */
export function getRewardFundQueryOptions(fundName = "post") {
  return queryOptions({
    queryKey: QueryKeys.core.rewardFund(fundName),
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_reward_fund", [
        fundName,
      ]) as Promise<RewardFund>,
  });
}

import { queryOptions } from "@tanstack/react-query";
import { DynamicProps } from "../types";
import { CONFIG } from "../config";
import { parseAsset } from "../utils";
import { QueryKeys } from "@/modules/core";

export function getDynamicPropsQueryOptions() {
  return queryOptions({
    queryKey: QueryKeys.core.dynamicProps(),
    refetchInterval: 60000,
    staleTime: 60000,
    refetchOnMount: true,
    queryFn: async (): Promise<DynamicProps> => {
      // Get raw blockchain data without transformation
      const rawGlobalDynamic: any = await CONFIG.hiveClient.database.getDynamicGlobalProperties();
      const rawFeedHistory: any = await CONFIG.hiveClient.database.call("get_feed_history");
      const rawChainProps: any = await CONFIG.hiveClient.database.call("get_chain_properties");
      const rawRewardFund: any = await CONFIG.hiveClient.database.call("get_reward_fund", ["post"]);

      // Calculate derived values for backward compatibility
      // parseAsset handles both string format ("200905388484 HIVE") and NAI format ({ amount, nai, precision })
      const totalVestingSharesAmount = parseAsset(rawGlobalDynamic.total_vesting_shares).amount;
      const totalVestingFundAmount = parseAsset(rawGlobalDynamic.total_vesting_fund_hive).amount;

      // Guard against division by zero/NaN/Infinity
      let hivePerMVests = 0;
      if (
        Number.isFinite(totalVestingSharesAmount) &&
        totalVestingSharesAmount !== 0 &&
        Number.isFinite(totalVestingFundAmount)
      ) {
        hivePerMVests = (totalVestingFundAmount / totalVestingSharesAmount) * 1e6;
      }
      const base = parseAsset(rawFeedHistory.current_median_history.base).amount;
      const quote = parseAsset(rawFeedHistory.current_median_history.quote).amount;
      const fundRecentClaims = parseFloat(rawRewardFund.recent_claims);
      const fundRewardBalance = parseAsset(rawRewardFund.reward_balance).amount;
      const hbdPrintRate = rawGlobalDynamic.hbd_print_rate;
      const hbdInterestRate = rawGlobalDynamic.hbd_interest_rate;
      const headBlock = rawGlobalDynamic.head_block_number;
      const totalVestingFund = totalVestingFundAmount;
      const totalVestingShares = totalVestingSharesAmount;
      const virtualSupply = parseAsset(rawGlobalDynamic.virtual_supply).amount;
      const vestingRewardPercent = rawGlobalDynamic.vesting_reward_percent || 0;
      const accountCreationFee = rawChainProps.account_creation_fee;

      return {
        // Backward compatible transformed fields (camelCase, parsed)
        hivePerMVests,
        base,
        quote,
        fundRecentClaims,
        fundRewardBalance,
        hbdPrintRate,
        hbdInterestRate,
        headBlock,
        totalVestingFund,
        totalVestingShares,
        virtualSupply,
        vestingRewardPercent,
        accountCreationFee,

        // Raw blockchain data (snake_case, unparsed) for direct use
        // Includes ALL fields from the blockchain responses
        raw: {
          globalDynamic: rawGlobalDynamic,
          feedHistory: rawFeedHistory,
          chainProps: rawChainProps,
          rewardFund: rawRewardFund,
        },
      } as DynamicProps;
    },
  });
}

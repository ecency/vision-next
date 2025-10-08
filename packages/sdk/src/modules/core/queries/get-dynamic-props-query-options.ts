import { queryOptions } from "@tanstack/react-query";
import { DynamicProps } from "../types";
import { CONFIG } from "../config";
import { parseAsset } from "../utils";

export function getDynamicPropsQueryOptions() {
  return queryOptions({
    queryKey: ["core", "dynamic-props"],
    refetchInterval: 60000,
    staleTime: 60000,
    refetchOnMount: true,
    queryFn: async (): Promise<DynamicProps> => {
      const globalDynamic = await CONFIG.hiveClient.database
        .getDynamicGlobalProperties()
        .then((r: any) => ({
          total_vesting_fund_hive:
            r.total_vesting_fund_hive || r.total_vesting_fund_steem,
          total_vesting_shares: r.total_vesting_shares,
          hbd_print_rate: r.hbd_print_rate || r.sbd_print_rate,
          hbd_interest_rate: r.hbd_interest_rate,
          head_block_number: r.head_block_number,
          vesting_reward_percent: r.vesting_reward_percent,
          virtual_supply: r.virtual_supply,
        }));

      const feedHistory =
        await CONFIG.hiveClient.database.call("get_feed_history");
      const chainProps = await CONFIG.hiveClient.database.call(
        "get_chain_properties"
      );
      const rewardFund = await CONFIG.hiveClient.database.call(
        "get_reward_fund",
        ["post"]
      );

      const hivePerMVests =
        (parseAsset(globalDynamic.total_vesting_fund_hive).amount /
          parseAsset(globalDynamic.total_vesting_shares).amount) *
        1e6;
      const base = parseAsset(feedHistory.current_median_history.base).amount;
      const quote = parseAsset(feedHistory.current_median_history.quote).amount;
      const fundRecentClaims = parseFloat(rewardFund.recent_claims);
      const fundRewardBalance = parseAsset(rewardFund.reward_balance).amount;
      const hbdPrintRate = globalDynamic.hbd_print_rate;
      const hbdInterestRate = globalDynamic.hbd_interest_rate;
      const headBlock = globalDynamic.head_block_number;
      const totalVestingFund = parseAsset(
        globalDynamic.total_vesting_fund_hive
      ).amount;
      const totalVestingShares = parseAsset(
        globalDynamic.total_vesting_shares
      ).amount;
      const virtualSupply = parseAsset(globalDynamic.virtual_supply).amount;
      const vestingRewardPercent = globalDynamic.vesting_reward_percent;
      const accountCreationFee = chainProps.account_creation_fee;

      return {
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
      };
    },
  });
}

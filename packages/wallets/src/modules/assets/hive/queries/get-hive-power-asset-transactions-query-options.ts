import { infiniteQueryOptions } from "@tanstack/react-query";
import { parseAsset } from "../../utils";
import {
  AuthorReward,
  ClaimRewardBalance,
  HiveOperationGroup,
  HiveTransaction,
} from "../types";
import { getHiveAssetTransactionsQueryOptions } from "./get-hive-asset-transactions-query-options";

export function getHivePowerAssetTransactionsQueryOptions(
  username: string | undefined,
  limit = 20,
  group: HiveOperationGroup
) {
  return infiniteQueryOptions<HiveTransaction[]>({
    ...getHiveAssetTransactionsQueryOptions(username, limit, group),
    queryKey: ["assets", "hive-power", "transactions", username, limit, group],
    select: ({ pages, pageParams }) => ({
      pageParams,
      pages: pages.map((page) =>
        page.filter((item) => {
          switch (item.type) {
            case "author_reward":
            case "comment_benefactor_reward":
              const vestingPayout = parseAsset(
                (item as AuthorReward).vesting_payout
              );
              return vestingPayout.amount > 0;

            case "claim_reward_balance":
              const rewardVests = parseAsset(
                (item as ClaimRewardBalance).reward_vests
              );
              return rewardVests.amount > 0;

            case "transfer_to_vesting":
              return true;
            case "transfer":
            case "transfer_to_savings":
            case "recurrent_transfer":
              return ["VESTS", "HP"].includes(
                parseAsset(item.amount).symbol
              );

            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["VESTS", "HP"].includes(asset.symbol);

            case "curation_reward":
            case "withdraw_vesting":
            case "delegate_vesting_shares":
            case "fill_vesting_withdraw":
            case "return_vesting_delegation":
            case "producer_reward":
            case "set_withdraw_vesting_route":
              return true;
            default:
              return false;
          }
        })
      ),
    }),
  });
}

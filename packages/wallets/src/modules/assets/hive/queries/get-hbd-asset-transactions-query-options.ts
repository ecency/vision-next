import { infiniteQueryOptions } from "@tanstack/react-query";
import { parseAsset } from "../../utils";
import {
  AuthorReward,
  ClaimRewardBalance,
  HiveOperationGroup,
  HiveTransaction,
} from "../types";
import { getHiveAssetTransactionsQueryOptions } from "./get-hive-asset-transactions-query-options";

export function getHbdAssetTransactionsQueryOptions(
  username: string | undefined,
  limit = 20,
  group: HiveOperationGroup
) {
  return infiniteQueryOptions<HiveTransaction[]>({
    ...getHiveAssetTransactionsQueryOptions(username, limit, group),
    queryKey: ["assets", "hbd", "transactions", username, limit, group],
    select: ({ pages, pageParams }) => ({
      pageParams,
      pages: pages.map((page) =>
        page.filter((item) => {
          switch (item.type) {
            case "author_reward":
            case "comment_benefactor_reward":
              const hbdPayout = parseAsset((item as AuthorReward).hbd_payout);
              return hbdPayout.amount > 0;

            case "claim_reward_balance":
              const rewardHbd = parseAsset(
                (item as ClaimRewardBalance).reward_hbd
              );
              return rewardHbd.amount > 0;

            case "transfer":
            case "transfer_to_savings":
            case "transfer_to_vesting":
            case "recurrent_transfer":
              return ["HBD"].includes(item.amount);

            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["HBD"].includes(asset.symbol);

            case "comment_reward":
            case "effective_comment_vote":
              return true;
            default:
              return false;
          }
        })
      ),
    }),
  });
}

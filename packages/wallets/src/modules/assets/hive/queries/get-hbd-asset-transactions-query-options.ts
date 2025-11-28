import { infiniteQueryOptions } from "@tanstack/react-query";
import { parseAsset } from "../../utils";
import {
  AuthorReward,
  ClaimRewardBalance,
  HiveOperationFilter,
  HiveOperationName,
  HiveTransaction,
} from "../types";
import {
  getHiveAssetTransactionsQueryOptions,
  resolveHiveOperationFilters,
} from "./get-hive-asset-transactions-query-options";

export function getHbdAssetTransactionsQueryOptions(
  username: string | undefined,
  limit = 20,
  filters: HiveOperationFilter = []
) {
  const { filterKey } = resolveHiveOperationFilters(filters);

  return infiniteQueryOptions<HiveTransaction[]>({
    ...getHiveAssetTransactionsQueryOptions(username, limit, filters),
    queryKey: ["assets", "hbd", "transactions", username, limit, filterKey],
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
              return parseAsset(item.amount).symbol === "HBD";

            case "transfer_from_savings" as HiveOperationName:
              return parseAsset((item as any).amount).symbol === "HBD";

            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["HBD"].includes(asset.symbol);

            case "cancel_transfer_from_savings":
            case "fill_order":
            case "limit_order_create":
            case "limit_order_cancel":
            case "fill_convert_request":
            case "fill_collateralized_convert_request":
            case "proposal_pay":
            case "interest":
              return true;

            case "limit_order_create2" as HiveOperationName:
              return true;
            default:
              return false;
          }
        })
      ),
    }),
  });
}

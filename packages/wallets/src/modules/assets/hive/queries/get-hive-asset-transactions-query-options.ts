import { CONFIG } from "@ecency/sdk";
import { utils } from "@hiveio/dhive";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { HIVE_ACCOUNT_OPERATION_GROUPS } from "../consts";
import {
  AuthorReward,
  ClaimRewardBalance,
  HiveOperationGroup,
  HiveTransaction,
} from "../types";
import { parseAsset } from "../../utils";

export function getHiveAssetTransactionsQueryOptions(
  username: string | undefined,
  limit = 20,
  group: HiveOperationGroup
) {
  return infiniteQueryOptions<HiveTransaction[]>({
    queryKey: ["assets", "hive", "transactions", username, limit, group],
    initialData: { pages: [], pageParams: [] },
    initialPageParam: -1,
    getNextPageParam: (lastPage, __) =>
      lastPage ? +(lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1,

    queryFn: async ({ pageParam }) => {
      let filters = [];

      switch (group) {
        case "transfers":
          filters = utils.makeBitMaskFilter(
            HIVE_ACCOUNT_OPERATION_GROUPS["transfers"]
          );
          break;
        case "market-orders":
          filters = utils.makeBitMaskFilter(
            HIVE_ACCOUNT_OPERATION_GROUPS["market-orders"]
          );
          break;
        case "interests":
          filters = utils.makeBitMaskFilter(
            HIVE_ACCOUNT_OPERATION_GROUPS["interests"]
          );
          break;
        case "stake-operations":
          filters = utils.makeBitMaskFilter(
            HIVE_ACCOUNT_OPERATION_GROUPS["stake-operations"]
          );
          break;
        case "rewards":
          filters = utils.makeBitMaskFilter(
            HIVE_ACCOUNT_OPERATION_GROUPS["rewards"]
          );
          break;
        default:
          filters = utils.makeBitMaskFilter([]);
      }

      const response = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_account_history",
        [username, pageParam, limit, ...filters]
      );

      return response.map(
        (x: any) =>
          ({
            num: x[0],
            type: x[1].op[0],
            timestamp: x[1].timestamp,
            trx_id: x[1].trx_id,
            ...x[1].op[1],
          }) satisfies HiveTransaction
      );
    },
    select: ({ pages, pageParams }) => ({
      pageParams,
      pages: pages.map((page) =>
        page.filter((item) => {
          switch (item.type) {
            case "author_reward":
            case "comment_benefactor_reward":
              const hivePayout = parseAsset((item as AuthorReward).hive_payout);
              return hivePayout.amount > 0;
            case "transfer":
            case "transfer_to_savings":
            case "transfer_to_vesting":
            case "recurrent_transfer":
              return ["HIVE"].includes(item.amount);

            case "fill_recurrent_transfer":
              const asset = parseAsset(item.amount);
              return ["HIVE"].includes(asset.symbol);

            case "claim_reward_balance":
              const rewardHive = parseAsset(
                (item as ClaimRewardBalance).reward_hive
              );
              return rewardHive.amount > 0;

            case "cancel_transfer_from_savings":
            case "fill_order":
            case "limit_order_create":
            case "limit_order_cancel":
            case "interest":
            case "fill_convert_request":
            case "fill_collateralized_convert_request":
            case "proposal_pay":
            case "update_proposal_votes":
            case "comment_payout_update":
            case "collateralized_convert":
            case "account_witness_proxy":
              return true;
            default:
              return false;
          }
        })
      ),
    }),
  });
}

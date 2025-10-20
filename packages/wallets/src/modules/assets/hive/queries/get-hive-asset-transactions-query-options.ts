import { CONFIG } from "@ecency/sdk";
import { utils } from "@hiveio/dhive";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { HIVE_ACCOUNT_OPERATION_GROUPS } from "../consts";
import {
  AuthorReward,
  ClaimRewardBalance,
  HiveOperationFilter,
  HiveOperationFilterKey,
  HiveOperationFilterValue,
  HiveOperationGroup,
  HiveOperationName,
  HiveTransaction,
} from "../types";
import { parseAsset } from "../../utils";

const operationOrders = utils.operationOrders;

function isHiveOperationName(value: string): value is HiveOperationName {
  return Object.prototype.hasOwnProperty.call(operationOrders, value);
}

export function resolveHiveOperationFilters(
  filters: HiveOperationFilter
): {
  filterKey: HiveOperationFilterKey;
  filterArgs: any[];
} {
  const rawValues: HiveOperationFilterValue[] = Array.isArray(filters)
    ? filters
    : [filters];

  const hasAll = rawValues.includes("" as HiveOperationGroup);

  const uniqueValues = Array.from(
    new Set(
      rawValues.filter(
        (value): value is HiveOperationFilterValue =>
          value !== undefined && value !== null && value !== ("" as HiveOperationGroup)
      )
    )
  );

  const filterKey: HiveOperationFilterKey =
    hasAll || uniqueValues.length === 0
      ? "all"
      : uniqueValues
          .map((value) => value.toString())
          .sort()
          .join("|");

  const operationIds = new Set<number>();

  if (!hasAll) {
    uniqueValues.forEach((value) => {
      if (value in HIVE_ACCOUNT_OPERATION_GROUPS) {
        HIVE_ACCOUNT_OPERATION_GROUPS[value as HiveOperationGroup].forEach((id) =>
          operationIds.add(id)
        );
        return;
      }

      if (isHiveOperationName(value)) {
        operationIds.add(operationOrders[value]);
      }
    });
  }

  const filterArgs = makeBitMaskFilter(Array.from(operationIds));

  return {
    filterKey,
    filterArgs,
  };
}

function makeBitMaskFilter(allowedOperations: number[]) {
  let low = 0n;
  let high = 0n;

  allowedOperations.forEach((operation) => {
    if (operation < 64) {
      low |= 1n << BigInt(operation);
    } else {
      high |= 1n << BigInt(operation - 64);
    }
  });

  return [low !== 0n ? low.toString() : null, high !== 0n ? high.toString() : null];
}

export function getHiveAssetTransactionsQueryOptions(
  username: string | undefined,
  limit = 20,
  filters: HiveOperationFilter = []
) {
  const { filterArgs, filterKey } = resolveHiveOperationFilters(filters);

  return infiniteQueryOptions<HiveTransaction[]>({
    queryKey: ["assets", "hive", "transactions", username, limit, filterKey],
    initialData: { pages: [], pageParams: [] },
    initialPageParam: -1,
    getNextPageParam: (lastPage, __) =>
      lastPage ? +(lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1,

    queryFn: async ({ pageParam }) => {
      const response = await CONFIG.hiveClient.call(
        "condenser_api",
        "get_account_history",
        [username, pageParam, limit, ...filterArgs]
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
              return parseAsset(item.amount).symbol === "HIVE";

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

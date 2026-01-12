import { infiniteQueryOptions } from "@tanstack/react-query";
import { utils } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core/config";
import { Transaction, OperationGroup } from "../types/transaction";

const ops = utils.operationOrders;

export const ACCOUNT_OPERATION_GROUPS: Record<OperationGroup, number[]> = {
  transfers: [
    ops.transfer,
    ops.transfer_to_savings,
    ops.transfer_from_savings,
    ops.cancel_transfer_from_savings,
    ops.recurrent_transfer,
    ops.fill_recurrent_transfer,
    ops.escrow_transfer,
    ops.fill_recurrent_transfer,
  ],
  "market-orders": [
    ops.fill_convert_request,
    ops.fill_order,
    ops.fill_collateralized_convert_request,
    ops.limit_order_create2,
    ops.limit_order_create,
    ops.limit_order_cancel,
  ],
  interests: [ops.interest],
  "stake-operations": [
    ops.return_vesting_delegation,
    ops.withdraw_vesting,
    ops.transfer_to_vesting,
    ops.set_withdraw_vesting_route,
    ops.update_proposal_votes,
    ops.fill_vesting_withdraw,
    ops.account_witness_proxy,
    ops.delegate_vesting_shares,
  ],
  rewards: [
    ops.author_reward,
    ops.curation_reward,
    ops.producer_reward,
    ops.claim_reward_balance,
    ops.comment_benefactor_reward,
    ops.liquidity_reward,
    ops.proposal_pay,
  ],
};

export const ALL_ACCOUNT_OPERATIONS = [...Object.values(ACCOUNT_OPERATION_GROUPS)].reduce(
  (acc, val) => acc.concat(val),
  []
);

type TxPage = Transaction[];
type TxCursor = number;

interface AccountHistoryOperation {
  timestamp: string;
  trx_id: string;
  op: [Transaction["type"], any];
}

type AccountHistoryRecord = [number, AccountHistoryOperation];

/**
 * Get account transaction history with pagination and filtering
 *
 * @param username - Account name to get transactions for
 * @param limit - Number of transactions per page
 * @param group - Filter by operation group (transfers, market-orders, etc.)
 */
export function getTransactionsInfiniteQueryOptions(
  username?: string,
  limit = 20,
  group: OperationGroup | "" = ""
) {
  return infiniteQueryOptions<TxPage, Error, TxPage, (string | number)[], TxCursor>({
    queryKey: ["accounts", "transactions", username ?? "", group, limit],
    initialPageParam: -1 as TxCursor,

    queryFn: async ({ pageParam }: { pageParam: TxCursor }) => {
      if (!username) {
        return [];
      }

      let filters: number[] | undefined;
      switch (group) {
        case "transfers":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["transfers"]);
          break;
        case "market-orders":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["market-orders"]);
          break;
        case "interests":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["interests"]);
          break;
        case "stake-operations":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["stake-operations"]);
          break;
        case "rewards":
          filters = utils.makeBitMaskFilter(ACCOUNT_OPERATION_GROUPS["rewards"]);
          break;
        default:
          filters = utils.makeBitMaskFilter(ALL_ACCOUNT_OPERATIONS);
      }

      const response = (await (filters
        ? CONFIG.hiveClient.call("condenser_api", "get_account_history", [
            username,
            pageParam,
            limit,
            ...filters,
          ])
        : CONFIG.hiveClient.call("condenser_api", "get_account_history", [
            username,
            pageParam,
            limit,
          ]))) as AccountHistoryRecord[];

      const mapped: Transaction[] = response
        .map(([num, operation]) => {
          const base = {
            num,
            type: operation.op[0],
            timestamp: operation.timestamp,
            trx_id: operation.trx_id,
          } as const;

          const payload = operation.op[1] as Record<string, unknown>;
          return { ...base, ...payload } as Transaction;
        })
        .filter(Boolean)
        .sort((a, b) => b.num - a.num);

      return mapped;
    },

    getNextPageParam: (lastPage: TxPage | undefined): TxCursor =>
      lastPage?.length ? (lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1,
  });
}

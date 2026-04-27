import { infiniteQueryOptions } from "@tanstack/react-query";
import { utils } from "../../../hive-tx";
import { QueryKeys } from "@/modules/core";
import { Transaction, OperationGroup } from "../types/transaction";
import { callREST } from "@/modules/core/hive-tx";

const ops = utils.operations;

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

interface HafahOperation {
  op: {
    type: string;
    value: Record<string, unknown>;
  };
  block: number;
  trx_id: string;
  op_pos: number;
  op_type_id: number;
  timestamp: string;
  virtual_op: boolean;
  operation_id: string;
  trx_in_block: number;
}

interface HafahResponse {
  total_operations: number;
  total_pages: number;
  operations_result: HafahOperation[];
}

/**
 * Derive a safe, unique, and chronologically ordered `num` from REST fields.
 *
 * Layout: block * 1_000_000 + trx_in_block * 100 + op_pos
 *   - trx_in_block: up to 9999 (Hive max block size allows ~65K txs but
 *     typical blocks have < 100; 4 digits covers all observed blocks)
 *   - op_pos: up to 99 (operations within a single transaction)
 *   - Max value: 105_000_000 * 1_000_000 = 1.05e14, within MAX_SAFE_INTEGER (9e15)
 */
function deriveNum(entry: HafahOperation): number {
  return entry.block * 1_000_000 + entry.trx_in_block * 100 + entry.op_pos;
}

/**
 * Strip the `_operation` suffix from the REST API type name
 * to match the Transaction type discriminants (e.g. "transfer").
 */
function normalizeOpType(restType: string): string {
  return restType.replace(/_operation$/, "");
}

/**
 * Get account transaction history with pagination and filtering.
 * Uses the hafah-api REST endpoint for server-side op-type filtering
 * and real pagination metadata.
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
  const operationTypes = group
    ? ACCOUNT_OPERATION_GROUPS[group]
    : ALL_ACCOUNT_OPERATIONS;

  return infiniteQueryOptions<TxPage, Error, TxPage, (string | number)[], TxCursor>({
    queryKey: QueryKeys.accounts.transactions(username ?? "", group, limit),
    initialPageParam: 1 as TxCursor,

    queryFn: async ({ pageParam }: { pageParam: TxCursor }) => {
      if (!username) {
        return [];
      }

      const response = (await callREST(
        "hafah",
        "/accounts/{account-name}/operations",
        {
          "account-name": username,
          "operation-types": operationTypes.join(","),
          "page-size": limit,
          page: pageParam,
        }
      )) as HafahResponse;

      return response.operations_result.map((entry) => {
        const type = normalizeOpType(entry.op.type);
        return {
          num: deriveNum(entry),
          type,
          timestamp: entry.timestamp,
          trx_id: entry.trx_id,
          ...entry.op.value,
        } as Transaction;
      });
    },

    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === limit ? lastPageParam + 1 : undefined,
  });
}

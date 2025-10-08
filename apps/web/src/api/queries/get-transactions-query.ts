import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { utils } from "@hiveio/dhive";
import { ACCOUNT_OPERATION_GROUPS, OperationGroup } from "@/consts";
import { Transaction } from "@/entities";

export const ALL_ACCOUNT_OPERATIONS = [...Object.values(ACCOUNT_OPERATION_GROUPS)].reduce(
  (acc, val) => acc.concat(val),
  []
);

export const getTransactionsQuery = (
  username?: string,
  limit = 20,
  group: OperationGroup = "" as OperationGroup
) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.TRANSACTIONS, username, group],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
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
          filters = utils.makeBitMaskFilter(ALL_ACCOUNT_OPERATIONS); // all
      }
      type TransactionDetails = Omit<Transaction, "num" | "type" | "timestamp" | "trx_id">;
      interface AccountHistoryOperation {
        timestamp: string;
        trx_id: string;
        op: [Transaction["type"], TransactionDetails];
      }
      type AccountHistoryRecord = [number, AccountHistoryOperation];

      const response = await (filters
        ? client.call<AccountHistoryRecord[]>("condenser_api", "get_account_history", [
            username,
            pageParam,
            limit,
            ...filters
          ])
        : client.call<AccountHistoryRecord[]>("condenser_api", "get_account_history", [
            username,
            pageParam,
            limit
          ]));
      const mapped = response.map<Transaction>(([num, operation]) => ({
        num,
        type: operation.op[0],
        timestamp: operation.timestamp,
        trx_id: operation.trx_id,
        ...operation.op[1]
      }));

      return mapped.filter((transaction) => transaction !== null).sort((a, b) => b.num - a.num);
    },
    initialData: { pages: [], pageParams: [] },
    initialPageParam: -1,
    getNextPageParam: (lastPage: Transaction[] | undefined) =>
      lastPage ? (lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1
  });

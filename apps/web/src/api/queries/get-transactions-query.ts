import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { utils } from "@hiveio/dhive";
import { ACCOUNT_OPERATION_GROUPS, OperationGroup } from "@/consts";
import { Transaction } from "@/entities";

export const ALL_ACCOUNT_OPERATIONS = [...Object.values(ACCOUNT_OPERATION_GROUPS)].reduce(
    (acc, val) => acc.concat(val),
    []
);

// Page = list of transactions; Cursor = last history index (number)
type TxPage = Transaction[];
type TxCursor = number;
interface AccountHistoryOperation {
    timestamp: string;
    trx_id: string;
    op: [Transaction["type"], any]; // 👈 payload varies per op
}
type AccountHistoryRecord = [number, AccountHistoryOperation];

export const getTransactionsQuery = (
    username?: string,
    limit = 20,
    group: OperationGroup = "" as OperationGroup
) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<TxPage, TxCursor>({
        queryKey: [QueryIdentifiers.TRANSACTIONS, username, group],
        initialData: { pages: [], pageParams: [] },
        initialPageParam: -1 as TxCursor,

        // 👇 annotate the destructured param and remove generics from client.call
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
                    filters = utils.makeBitMaskFilter(ALL_ACCOUNT_OPERATIONS); // all
            }

            type TransactionDetails = Omit<Transaction, "num" | "type" | "timestamp" | "trx_id">;
            interface AccountHistoryOperation {
                timestamp: string;
                trx_id: string;
                op: [Transaction["type"], TransactionDetails];
            }
            type AccountHistoryRecord = [number, AccountHistoryOperation];

            const response = (await (filters
                ? client.call("condenser_api", "get_account_history", [
                    username,
                    pageParam,
                    limit,
                    ...filters,
                ])
                : client.call("condenser_api", "get_account_history", [
                    username,
                    pageParam,
                    limit,
                ]))) as AccountHistoryRecord[];

            // Build base + spread payload, then assert union
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

        getNextPageParam: (
            lastPage: TxPage | undefined
        ): TxCursor => (lastPage?.length ? (lastPage[lastPage.length - 1]?.num ?? 0) - 1 : -1),
    });

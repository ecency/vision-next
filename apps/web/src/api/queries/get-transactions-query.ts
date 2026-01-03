import { EcencyQueriesManager } from "@/core/react-query";
import { getTransactionsInfiniteQueryOptions, OperationGroup } from "@ecency/sdk";

export const getTransactionsQuery = (
  username?: string,
  limit = 20,
  group: OperationGroup | "" = ""
) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery(
    getTransactionsInfiniteQueryOptions(username, limit, group)
  );

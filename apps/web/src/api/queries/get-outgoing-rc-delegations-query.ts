import { EcencyQueriesManager } from "@/core/react-query";
import { getOutgoingRcDelegationsInfiniteQueryOptions } from "@ecency/sdk";

export const getOutgoingRcDelegationsQuery = (username: string, limit = 100) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery(
    getOutgoingRcDelegationsInfiniteQueryOptions(username, limit)
  );

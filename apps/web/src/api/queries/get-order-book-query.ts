import { EcencyQueriesManager } from "@/core/react-query";
import { getOrderBookQueryOptions } from "@ecency/sdk";

export const getOrderBookQuery = (limit = 500) =>
  EcencyQueriesManager.generateClientServerQuery(getOrderBookQueryOptions(limit));

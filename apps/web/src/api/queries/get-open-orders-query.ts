import { EcencyQueriesManager } from "@/core/react-query";
import { getOpenOrdersQueryOptions } from "@ecency/sdk";

export const getOpenOrdersQuery = (user: string) =>
  EcencyQueriesManager.generateClientServerQuery(getOpenOrdersQueryOptions(user));

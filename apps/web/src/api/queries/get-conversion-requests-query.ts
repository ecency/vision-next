import { EcencyQueriesManager } from "@/core/react-query";
import { getConversionRequestsQueryOptions } from "@ecency/sdk";

export const getConversionRequestsQuery = (account: string) =>
  EcencyQueriesManager.generateClientServerQuery(getConversionRequestsQueryOptions(account));

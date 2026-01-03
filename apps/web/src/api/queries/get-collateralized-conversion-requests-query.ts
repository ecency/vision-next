import { EcencyQueriesManager } from "@/core/react-query";
import { getCollateralizedConversionRequestsQueryOptions } from "@ecency/sdk";

export const getCollateralizedConversionRequestsQuery = (account: string) =>
  EcencyQueriesManager.generateClientServerQuery(
    getCollateralizedConversionRequestsQueryOptions(account)
  );

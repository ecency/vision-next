import { EcencyQueriesManager } from "@/core/react-query";
import { getWithdrawRoutesQueryOptions } from "@ecency/sdk";

export const getWithdrawRoutesQuery = (account: string) =>
  EcencyQueriesManager.generateClientServerQuery(getWithdrawRoutesQueryOptions(account));

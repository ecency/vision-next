import { EcencyQueriesManager } from "@/core/react-query";
import { getSavingsWithdrawFromQueryOptions } from "@ecency/sdk";

export const getSavingsWithdrawFromQuery = (account: string) =>
  EcencyQueriesManager.generateClientServerQuery(getSavingsWithdrawFromQueryOptions(account));

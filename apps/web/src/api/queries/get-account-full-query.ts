import { EcencyQueriesManager } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

export const getAccountFullQuery = (username?: string) =>
  EcencyQueriesManager.generateClientServerQuery(
    getAccountFullQueryOptions(username)
  );

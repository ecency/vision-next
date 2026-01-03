import { EcencyQueriesManager } from "@/core/react-query";
import { getControversialRisingInfiniteQueryOptions } from "@ecency/sdk";

export const getControversialRisingQuery = (what: string, tag: string, enabled = true) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery(
    getControversialRisingInfiniteQueryOptions(what, tag, enabled)
  );

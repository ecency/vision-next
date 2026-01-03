import { EcencyQueriesManager } from "@/core/react-query";
import { getWitnessesInfiniteQueryOptions } from "@ecency/sdk";

export const getWitnessesQuery = (limit: number) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery(
    getWitnessesInfiniteQueryOptions(limit)
  );

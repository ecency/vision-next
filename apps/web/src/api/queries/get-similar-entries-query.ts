import { EcencyQueriesManager } from "@/core/react-query";
import { Entry } from "@/entities";
import { getSimilarEntriesQueryOptions } from "@ecency/sdk";

export const getSimilarEntriesQuery = (entry: Entry) =>
  EcencyQueriesManager.generateClientServerQuery(getSimilarEntriesQueryOptions(entry));

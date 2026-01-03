import { EcencyQueriesManager } from "@/core/react-query";
import { getProposalsQueryOptions } from "@ecency/sdk";

export const getProposalsQuery = () =>
  EcencyQueriesManager.generateClientServerQuery(getProposalsQueryOptions());

import { EcencyQueriesManager } from "@/core/react-query";
import { getProposalQueryOptions } from "@ecency/sdk";

export const getProposalQuery = (id: number) =>
  EcencyQueriesManager.generateClientServerQuery(getProposalQueryOptions(id));

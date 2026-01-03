import { EcencyQueriesManager } from "@/core/react-query";
import { getDeletedEntryQueryOptions } from "@ecency/sdk";

export const getDeletedEntryQuery = (author: string, permlink: string) => {
  return EcencyQueriesManager.generateClientServerQuery(
    getDeletedEntryQueryOptions(author, permlink)
  );
};

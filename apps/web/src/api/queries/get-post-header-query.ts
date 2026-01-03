import { EcencyQueriesManager } from "@/core/react-query";
import { getPostHeaderQueryOptions } from "@ecency/sdk";

export function getPostHeaderQuery(author: string, permlink: string) {
  return EcencyQueriesManager.generateClientServerQuery(
    getPostHeaderQueryOptions(author, permlink)
  );
}

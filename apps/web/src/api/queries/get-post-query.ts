import { EcencyQueriesManager } from "@/core/react-query";
import { getPostQueryOptions } from "@ecency/sdk";

export const getPostQuery = (
  author: string,
  permlink?: string,
  observer = "",
  num?: number
) =>
  EcencyQueriesManager.generateClientServerQuery(
    getPostQueryOptions(author, permlink, observer, num)
  );

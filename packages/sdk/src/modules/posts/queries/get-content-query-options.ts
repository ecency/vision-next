import { QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

export function getContentQueryOptions(author: string, permlink: string) {
  return queryOptions({
    queryKey: QueryKeys.posts.content(author, permlink),
    enabled: !!author && !!permlink,
    queryFn: async (): Promise<Entry> =>
      callRPC("condenser_api.get_content", [
        author,
        permlink,
      ]) as Promise<Entry>,
  });
}

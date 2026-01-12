import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";

export function getPostHeaderQueryOptions(author: string, permlink: string) {
  return queryOptions({
    queryKey: ["posts", "post-header", author, permlink],
    queryFn: async () => {
      return CONFIG.hiveClient.call("bridge", "get_post_header", {
        author,
        permlink,
      }) as Promise<Entry | null>;
    },
    initialData: null,
  });
}

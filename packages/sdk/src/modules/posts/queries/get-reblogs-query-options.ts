import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export interface BlogEntry {
  author: string;
  permlink: string;
  blog: string;
  reblog_on: string;
  reblogged_on: string;
  entry_id: number;
}

export interface Reblog {
  author: string;
  permlink: string;
}

export function getReblogsQueryOptions(
  username?: string,
  activeUsername?: string,
  limit = 200
) {
  return queryOptions({
    queryKey: ["posts", "reblogs", username ?? "", limit],
    queryFn: async () => {
      const response = (await CONFIG.hiveClient.call("condenser_api", "get_blog_entries", [
        username ?? activeUsername,
        0,
        limit,
      ])) as BlogEntry[];

      return response
        .filter(
          (i) =>
            i.author !== activeUsername &&
            !i.reblogged_on.startsWith("1970-")
        )
        .map((i) => ({ author: i.author, permlink: i.permlink })) as Reblog[];
    },
    enabled: !!username,
  });
}

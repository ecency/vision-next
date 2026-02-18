import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";
import { PostTipsResponse } from "../types/post-tip";

export function getPostTipsQueryOptions(author: string, permlink: string, isEnabled = true) {
  return queryOptions({
    queryKey: QueryKeys.posts.tips(author, permlink),
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/post-tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author,
          permlink,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch post tips: ${response.status}`);
      }

      return response.json() as Promise<PostTipsResponse>;
    },
    enabled: !!author && !!permlink && isEnabled,
  });
}

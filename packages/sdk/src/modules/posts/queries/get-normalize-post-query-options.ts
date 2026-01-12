import { queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";
import { normalizePost } from "@/modules/bridge";

export function getNormalizePostQueryOptions(
  post: { author?: string; permlink?: string } | undefined,
  enabled = true
) {
  return queryOptions({
    queryKey: [
      "posts",
      "normalize",
      post?.author ?? "",
      post?.permlink ?? "",
    ],
    enabled: enabled && !!post,
    queryFn: async () => normalizePost(post) as Promise<Entry | null>,
  });
}

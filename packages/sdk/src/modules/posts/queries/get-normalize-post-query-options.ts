import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { Entry } from "../types";
import { normalizePost } from "@/modules/bridge";

export function getNormalizePostQueryOptions(
  post: { author?: string; permlink?: string } | undefined,
  enabled = true
) {
  return queryOptions({
    queryKey: QueryKeys.posts.normalize(post?.author ?? "", post?.permlink ?? ""),
    enabled: enabled && !!post,
    queryFn: async () => normalizePost(post) as Promise<Entry | null>,
  });
}

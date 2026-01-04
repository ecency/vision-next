import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { CommentHistory } from "../types/comment-history";

export function getCommentHistoryQueryOptions(author: string, permlink: string, onlyMeta = false) {
  return queryOptions({
    queryKey: ["posts", "comment-history", author, permlink, onlyMeta],
    queryFn: async ({ signal }) => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/comment-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author,
          permlink,
          onlyMeta: onlyMeta ? "1" : "",
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch comment history: ${response.status}`);
      }

      return response.json() as Promise<CommentHistory>;
    },
    enabled: !!author && !!permlink,
  });
}

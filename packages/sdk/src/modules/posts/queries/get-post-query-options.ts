import { queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";
import { CONFIG } from "@/modules/core/config";
import { validateEntry } from "../functions";
import { dmca_accounts } from "@/modules/core";

export function getPostQueryOptions(
  author: string,
  permlink: string,
  observer: string = "",
  num?: number
) {
  return queryOptions({
    queryKey: ["posts", "post", author, permlink],
    queryFn: async () => {
      const resp = await CONFIG.hiveClient.call("bridge", "get_post", {
        author,
        permlink,
        observer,
      });

      if (resp) {
        // Validate and fix the entry before processing
        const validatedEntry = validateEntry(resp);
        const post = await resolvePost(validatedEntry, observer, num);

        if (
          dmca_accounts.some((rx) =>
            new RegExp(rx).test(`@${post.author}/${post.permlink}`)
          )
        ) {
          post.body =
            "This post is not available due to a copyright/fraudulent claim.";
          post.title = "";
        }

        return post;
      }

      return undefined;
    },
  });
}

export async function resolvePost(
  post: Entry,
  observer: string,
  num?: number
): Promise<Entry> {
  const { json_metadata: json } = post;

  if (
    json?.original_author &&
    json?.original_permlink &&
    json.tags?.[0] === "cross-post"
  ) {
    try {
      const query = getPostQueryOptions(
        json.original_author,
        json.original_permlink,
        observer,
        num
      );
      await CONFIG.queryClient.prefetchQuery(query);
      const resp = await CONFIG.queryClient.getQueryData(query.queryKey);
      if (resp) {
        return {
          ...post,
          original_entry: resp,
          num,
        };
      }
      return post;
    } catch (e) {
      return post;
    }
  }

  return { ...post, num };
}

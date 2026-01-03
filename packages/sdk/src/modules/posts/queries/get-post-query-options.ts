import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";

function makeEntryPath(category: string, author: string, permlink: string) {
  return `${category}/@${author}/${permlink}`;
}

export function getPostQueryOptions(
  author: string,
  permlink?: string,
  observer = "",
  num?: number
) {
  const cleanPermlink = permlink?.trim();
  const entryPath = makeEntryPath("", author, cleanPermlink ?? "");

  return queryOptions({
    queryKey: ["posts", "entry", entryPath],
    queryFn: async () => {
      if (!cleanPermlink || cleanPermlink === "undefined") {
        return null;
      }

      const response = await CONFIG.hiveClient.call("bridge", "get_post", {
        author,
        permlink: cleanPermlink,
        observer,
      });

      if (response && num !== undefined) {
        return { ...response, num } as Entry;
      }

      return response as Entry | null;
    },
    enabled:
      !!author &&
      !!permlink &&
      permlink.trim() !== "" &&
      permlink.trim() !== "undefined",
  });
}

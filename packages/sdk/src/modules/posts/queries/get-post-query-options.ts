import { CONFIG, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";
import { filterDmcaEntry } from "../utils/filter-dmca-entries";

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
    queryKey: QueryKeys.posts.entry(entryPath),
    queryFn: async () => {
      if (!cleanPermlink || cleanPermlink === "undefined") {
        return null;
      }

      const response = await CONFIG.hiveClient.call("bridge", "get_post", {
        author,
        permlink: cleanPermlink,
        observer,
      });

      if (!response) {
        return null;
      }

      const entry = num !== undefined ? { ...response, num } as Entry : response as Entry;
      return filterDmcaEntry(entry);
    },
    enabled:
      !!author &&
      !!permlink &&
      permlink.trim() !== "" &&
      permlink.trim() !== "undefined",
  });
}

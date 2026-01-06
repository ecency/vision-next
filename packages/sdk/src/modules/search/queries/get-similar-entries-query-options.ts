import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { SearchResponse } from "../types/search-response";

interface Entry {
  author: string;
  permlink: string;
  json_metadata?: {
    tags?: string[];
  };
}

function buildQuery(entry: Entry, retry = 3) {
  const { json_metadata, permlink } = entry;

  let q = "*";
  q += ` -dporn type:post`;
  let tags;

  // 3 tags and decrease until there is enough relevant posts
  if (json_metadata && json_metadata.tags && Array.isArray(json_metadata.tags)) {
    tags = json_metadata.tags
      .filter((tag) => tag && tag !== "")
      .filter((tag) => !tag.startsWith("hive-")) // filter out communities
      .filter((_tag, ind) => ind < +retry)
      .join(",");
  }

  // check to make sure tags are not empty
  if (tags && tags.length > 0) {
    q += ` tag:${tags}`;
  } else {
    // no tags in post, try with permlink
    const fperm = permlink.split("-");
    tags = fperm
      .filter((part: string) => part !== "")
      .filter((part: string) => !/^-?\d+$/.test(part))
      .filter((part: string) => part.length > 2)
      .join(",");
    q += ` tag:${tags}`;
  }

  return q;
}

export function getSimilarEntriesQueryOptions(entry: Entry) {
  const query = buildQuery(entry);

  return queryOptions({
    queryKey: ["search", "similar-entries", entry.author, entry.permlink, query],
    queryFn: async () => {
      const data = {
        q: query,
        sort: "newest",
        hide_low: "0",
      };

      const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const searchResponse = (await response.json()) as SearchResponse;

      const rawEntries = searchResponse.results.filter(
        (r) => r.permlink !== entry.permlink && r.tags.indexOf("nsfw") === -1
      );

      const entries = [];
      for (const result of rawEntries) {
        if (entries.find((y) => y.author === result.author) === undefined) {
          entries.push(result);
        }
      }

      return entries.slice(0, 3);
    },
  });
}

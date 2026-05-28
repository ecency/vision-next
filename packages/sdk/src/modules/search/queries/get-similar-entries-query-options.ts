import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { similar } from "../requests";
import { SearchResult } from "../types/search-response";

// Without a recency window the backend ranks across the entire historical
// index and surfaces years-old posts. Constrain suggestions to the last
// ~6 months so related posts stay fresh (it also bounds the backend's
// more_like_this candidate set, which is what keeps it fast).
const SIMILAR_ENTRIES_SINCE_MS = 182 * 24 * 60 * 60 * 1000;

// How many results the suggestions strip renders at most.
const SIMILAR_ENTRIES_TARGET = 3;

// more_like_this only extracts a handful of significant terms, so a short
// body excerpt is enough signal and keeps the request payload small.
const SIMILAR_ENTRIES_BODY_LIMIT = 2000;

// The strip is hidden below this many results. A lone suggestion looks
// sparse. Exported so the web component shares one threshold (filter == render).
export const SIMILAR_ENTRIES_MIN_RENDER = 2;

interface Entry {
  author: string;
  permlink: string;
  title?: string;
  body?: string;
  json_metadata?: {
    tags?: string[];
  };
}

export function getSimilarEntriesQueryOptions(entry: Entry) {
  return queryOptions({
    queryKey: QueryKeys.search.similarEntries(entry.author, entry.permlink),
    queryFn: async ({ signal }) => {
      // Naive `YYYY-MM-DDTHH:mm:ss` (no `Z`) matches the search-api date
      // contract used elsewhere; a <14h skew on a 182-day boundary is immaterial.
      const since = new Date(Date.now() - SIMILAR_ENTRIES_SINCE_MS).toISOString().slice(0, 19);

      const tags = (entry.json_metadata?.tags ?? []).filter(
        (tag): tag is string => typeof tag === "string" && tag !== ""
      );

      // Elasticsearch more_like_this recommendations: content-based "related
      // posts" ranked by shared significant terms in title/body/tags, scoped
      // to the recency window. The backend already excludes the source author,
      // spam and nsfw.
      const response = await similar(
        {
          author: entry.author,
          permlink: entry.permlink,
          title: entry.title ?? "",
          body: (entry.body ?? "").slice(0, SIMILAR_ENTRIES_BODY_LIMIT),
          tags,
          since
        },
        signal
      );

      // Light client guard mirroring the render contract: never the source
      // post, never nsfw, one per author, capped at the render target.
      const collected: SearchResult[] = [];
      const seenAuthors = new Set<string>();
      for (const r of response.results) {
        if (collected.length >= SIMILAR_ENTRIES_TARGET) break;
        if (r.permlink === entry.permlink) continue;
        if ((r.tags ?? []).indexOf("nsfw") !== -1) continue;
        if (seenAuthors.has(r.author)) continue;
        seenAuthors.add(r.author);
        collected.push(r);
      }

      return collected;
    }
  });
}

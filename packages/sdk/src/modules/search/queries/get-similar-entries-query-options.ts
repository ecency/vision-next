import { queryOptions } from "@tanstack/react-query";
import { CONFIG, INTERNAL_API_TIMEOUT_MS, withTimeoutSignal, QueryKeys } from "@/modules/core";
import { callREST } from "@/modules/core/hive-tx";
import { SearchResponse, SearchResult } from "../types/search-response";

// Without a recency window the search-api ranks across the entire historical
// index and surfaces years-old posts. Constrain suggestions to the last
// ~6 months so related posts stay fresh.
const SIMILAR_ENTRIES_SINCE_MS = 182 * 24 * 60 * 60 * 1000;

// How many results the suggestions strip needs.
const SIMILAR_ENTRIES_TARGET = 3;

interface Entry {
  author: string;
  permlink: string;
  json_metadata?: {
    tags?: string[];
  };
}

/** Minimal subset of HiveSense's `/posts/{author}/{permlink}/similar` response. */
interface HivesenseSimilarPost {
  author: string;
  permlink: string;
  title?: string;
  body?: string;
  category?: string;
  created?: string;
  payout?: number;
  children?: number;
  depth?: number;
  stats?: { gray?: boolean; hide?: boolean };
  json_metadata?: { tags?: string[] };
}

function buildQuery(entry: Entry, retry = 3) {
  const { json_metadata, permlink } = entry;

  let q = "*";
  q += ` -dporn type:post`;
  let tags;

  // 3 tags and decrease until there is enough relevant posts
  if (json_metadata && json_metadata.tags && Array.isArray(json_metadata.tags)) {
    tags = json_metadata.tags
      .filter((tag) => tag && tag !== "" && typeof tag === "string")
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

/** Adapt a HiveSense post into the SearchResult shape the UI renders. */
function mapHivesensePost(p: HivesenseSimilarPost): SearchResult {
  // Carry real tags through so addUnique's nsfw guard works on HiveSense
  // results. HiveSense has no top-level `tags`; tags live in json_metadata,
  // and the category (first/parent tag) can itself be the nsfw marker.
  const tags = (p.json_metadata?.tags ?? []).filter(
    (t): t is string => typeof t === "string"
  );
  if (p.category && !tags.includes(p.category)) {
    tags.unshift(p.category);
  }

  return {
    id: 0,
    title: p.title ?? "",
    body: p.body ?? "",
    category: p.category ?? "",
    author: p.author,
    permlink: p.permlink,
    author_rep: 0,
    total_payout: p.payout ?? 0,
    img_url: "",
    created_at: p.created ?? "",
    children: p.children ?? 0,
    tags,
    app: "",
    depth: p.depth ?? 0,
  };
}

export function getSimilarEntriesQueryOptions(entry: Entry) {
  const query = buildQuery(entry);

  return queryOptions({
    queryKey: QueryKeys.search.similarEntries(entry.author, entry.permlink, query),
    queryFn: async ({ signal }) => {
      const sinceMs = Date.now() - SIMILAR_ENTRIES_SINCE_MS;
      // Naive `YYYY-MM-DDTHH:mm:ss` (no `Z`) is intentional: the search-api
      // contract is the same naive format the main search sends
      // (dayjs().format("YYYY-MM-DDTHH:mm:ss")). Whether the server reads it
      // as UTC or local only shifts a 182-day boundary by <14h (<0.3%),
      // which is immaterial for a coarse recency cutoff.
      const since = new Date(sinceMs).toISOString().slice(0, 19);

      const collected: SearchResult[] = [];
      const seenAuthors = new Set<string>();

      // Excludes the source post, nsfw, and same-author duplicates; preserves
      // insertion order so primary (relevance) results stay first.
      const addUnique = (r: SearchResult) => {
        if (collected.length >= SIMILAR_ENTRIES_TARGET) return;
        if (r.permlink === entry.permlink) return;
        if ((r.tags ?? []).indexOf("nsfw") !== -1) return;
        if (seenAuthors.has(r.author)) return;
        seenAuthors.add(r.author);
        collected.push(r);
      };

      // 1) Primary: Ecency search-api (hivesearcher). `since` constrains
      //    recency server-side, so these are already fresh.
      const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, sort: "newest", hide_low: false, since }),
        signal: withTimeoutSignal(INTERNAL_API_TIMEOUT_MS, signal),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const searchResponse = (await response.json()) as SearchResponse;
      for (const result of searchResponse.results) {
        addUnique(result);
      }

      // 2) Fallback: HiveSense semantic similarity (decentralized; callREST
      //    auto-fails over nodes that don't host /hivesense-api). HiveSense
      //    ranks purely by semantics with no recency bias, so apply the same
      //    ~6-month window client-side to keep suggestions fresh.
      if (collected.length < SIMILAR_ENTRIES_TARGET) {
        try {
          const hs = await callREST(
            "hivesense",
            "/posts/{author}/{permlink}/similar",
            {
              author: entry.author,
              permlink: entry.permlink,
              result_limit: 12,
              full_posts: 1,
              truncate: 200,
            },
            undefined,
            undefined,
            signal
          );

          const list: HivesenseSimilarPost[] = Array.isArray(hs) ? hs : [];
          for (const p of list) {
            if (collected.length >= SIMILAR_ENTRIES_TARGET) break;
            if (!p || !p.created) continue;
            if (p.stats && (p.stats.gray || p.stats.hide)) continue;
            const createdMs = new Date(
              p.created.endsWith("Z") ? p.created : `${p.created}Z`
            ).getTime();
            if (!Number.isFinite(createdMs) || createdMs < sinceMs) continue;
            addUnique(mapHivesensePost(p));
          }
        } catch {
          // HiveSense is a best-effort fallback; ignore failures (e.g. the
          // post isn't indexed, or no node currently serves /hivesense-api).
        }
      }

      return collected.slice(0, SIMILAR_ENTRIES_TARGET);
    },
  });
}

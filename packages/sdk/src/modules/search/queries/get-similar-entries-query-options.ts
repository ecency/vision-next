import { queryOptions } from "@tanstack/react-query";
import { CONFIG, INTERNAL_API_TIMEOUT_MS, withTimeoutSignal, QueryKeys } from "@/modules/core";
import { callREST } from "@/modules/core/hive-tx";
import { SearchResponse, SearchResult } from "../types/search-response";

// Without a recency window the search-api ranks across the entire historical
// index and surfaces years-old posts. Constrain suggestions to the last
// ~6 months so related posts stay fresh.
const SIMILAR_ENTRIES_SINCE_MS = 182 * 24 * 60 * 60 * 1000;

// How many results the suggestions strip renders at most.
const SIMILAR_ENTRIES_TARGET = 3;

// Fetch breadth from each source. CRITICAL: HiveSense's `full_posts` is the
// number of results it *hydrates* (created/title/body/json_metadata) — it is
// NOT a boolean. The remainder come back as author/permlink stubs the
// recency/map logic must drop. So `full_posts` MUST equal `result_limit`;
// the old `full_posts: 1` made HiveSense usable for exactly ONE of
// `result_limit` results, so it ~never backfilled. Bumped to 50 because the
// 6-month recency filter drops most semantic neighbours (HiveSense ranks by
// embedding similarity with no recency bias), and the search-api primary
// path is currently producing 0 hits for tag-filtered queries, leaving
// HiveSense as the sole source.
const SIMILAR_ENTRIES_LIMIT = 50;

// The strip is hidden below this many results. A lone suggestion looks
// sparse, and the previous all-or-nothing-at-exactly-3 hid it on most posts.
// Exported so the web component shares one threshold (filter == render).
export const SIMILAR_ENTRIES_MIN_RENDER = 2;

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
  json_metadata?: { tags?: string[]; image?: string[] };
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

  // Thumbnail: HiveSense has no top-level image; the post image lives in
  // json_metadata.image (standard Hive shape). Pick the first non-empty
  // string so the suggestions strip renders a thumbnail instead of the
  // no-image placeholder. catchPostImage() on the web side proxifies it.
  const imgUrl =
    (Array.isArray(p.json_metadata?.image)
      ? p.json_metadata!.image.find(
          (u): u is string => typeof u === "string" && u.length > 0
        )
      : undefined) ?? "";

  return {
    id: 0,
    title: p.title ?? "",
    body: p.body ?? "",
    category: p.category ?? "",
    author: p.author,
    permlink: p.permlink,
    author_rep: 0,
    total_payout: p.payout ?? 0,
    img_url: imgUrl,
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
      // immaterial for a coarse recency cutoff.
      const since = new Date(sinceMs).toISOString().slice(0, 19);

      // Primary: Ecency search-api (hivesearcher). `since` constrains recency
      // server-side. Throws on a non-2xx so a real outage surfaces (distinct
      // from a legitimately empty result set).
      const primary = (async (): Promise<SearchResult[]> => {
        const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query, sort: "newest", hide_low: false, since }),
          signal: withTimeoutSignal(INTERNAL_API_TIMEOUT_MS, signal),
        });
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        return ((await response.json()) as SearchResponse).results;
      })();

      // Secondary: HiveSense semantic similarity (decentralized; callREST
      // fails over nodes serving /hivesense-api — a hivesense-scoped node
      // list keeps it on the ~2 hosts that actually serve it). No recency
      // bias, so apply the same ~6-month window client-side. `full_posts`
      // MUST equal `result_limit` — see SIMILAR_ENTRIES_LIMIT.
      const hivesense = (async (): Promise<SearchResult[]> => {
        const hs = await callREST(
          "hivesense",
          "/posts/{author}/{permlink}/similar",
          {
            author: entry.author,
            permlink: entry.permlink,
            result_limit: SIMILAR_ENTRIES_LIMIT,
            full_posts: SIMILAR_ENTRIES_LIMIT,
            // The suggestions strip renders title + thumbnail only (body is
            // never displayed), so don't pay to hydrate body text. We still
            // need json_metadata (for the thumbnail/tags), which full_posts
            // hydrates independently of truncate.
            truncate: 0,
          },
          undefined,
          undefined,
          signal
        );
        const list: HivesenseSimilarPost[] = Array.isArray(hs) ? hs : [];
        const out: SearchResult[] = [];
        for (const p of list) {
          if (!p || !p.created) continue;
          if (p.stats && (p.stats.gray || p.stats.hide)) continue;
          const createdMs = new Date(
            p.created.endsWith("Z") ? p.created : `${p.created}Z`
          ).getTime();
          if (!Number.isFinite(createdMs) || createdMs < sinceMs) continue;
          out.push(mapHivesensePost(p));
        }
        return out;
      })();

      // Query both in parallel and MERGE — primary (relevance) first, then
      // HiveSense (semantic) as backfill. Each source is independent: one
      // failing still yields the other; only a total failure throws so React
      // Query retries instead of silently rendering nothing.
      const [primaryRes, hivesenseRes] = await Promise.allSettled([
        primary,
        hivesense,
      ]);

      if (
        primaryRes.status === "rejected" &&
        hivesenseRes.status === "rejected"
      ) {
        throw primaryRes.reason instanceof Error
          ? primaryRes.reason
          : new Error("similar-entries: all sources failed");
      }

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

      if (primaryRes.status === "fulfilled") {
        for (const r of primaryRes.value) addUnique(r);
      }
      if (hivesenseRes.status === "fulfilled") {
        for (const r of hivesenseRes.value) addUnique(r);
      }

      return collected.slice(0, SIMILAR_ENTRIES_TARGET);
    },
  });
}

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

// HiveSense fetch breadth. `full_posts` is the number of results it
// *hydrates* (created/title/body/json_metadata) — NOT a boolean — and must
// equal `result_limit` since unhydrated stubs are dropped. HiveSense is only
// consulted when search-api returns fewer than SIMILAR_ENTRIES_TARGET
// usable results, so we just need enough to backfill 1-2 slots after the
// 6-month recency cutoff (HiveSense has no recency bias) culls most.
const SIMILAR_ENTRIES_LIMIT = 15;

// Overly broad primary tags worth skipping when there are more specific
// alternatives. The 2-tag filter is far more permissive than the old 3-tag
// AND, so dropping these only matters when a post lists e.g. `hive` first
// followed by something specific.
const GENERIC_TAGS = new Set([
  "hive",
  "blog",
  "life",
  "blogger",
  "dailyblog",
  "post",
  "ecency",
  "esteem",
]);

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

function buildQuery(entry: Entry) {
  const { json_metadata, permlink } = entry;

  let q = "*";
  q += ` type:post`;
  let tags;

  // Pick up to 2 specific tags. Two AND-filtered tags is enough overlap to
  // surface topically-similar posts without being so restrictive that the
  // result set collapses (the old 3-tag AND often returned <20 hits for
  // niche tag combinations).
  if (json_metadata && json_metadata.tags && Array.isArray(json_metadata.tags)) {
    const cleaned = json_metadata.tags
      .filter((tag): tag is string => typeof tag === "string" && tag !== "")
      .filter((tag) => !tag.startsWith("hive-")); // drop community tags
    const specific = cleaned.filter((tag) => !GENERIC_TAGS.has(tag));
    const chosen = (specific.length > 0 ? specific : cleaned).slice(0, 2);
    tags = chosen.join(",");
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
      .slice(0, 2)
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

      const collected: SearchResult[] = [];
      const seenAuthors = new Set<string>();
      // Excludes the source post, nsfw, and same-author duplicates; preserves
      // insertion order so search-api (primary) results stay first.
      const addUnique = (r: SearchResult) => {
        if (collected.length >= SIMILAR_ENTRIES_TARGET) return;
        if (r.permlink === entry.permlink) return;
        if ((r.tags ?? []).indexOf("nsfw") !== -1) return;
        if (seenAuthors.has(r.author)) return;
        seenAuthors.add(r.author);
        collected.push(r);
      };

      // Primary: Ecency search-api. `popularity` sort returns posts ranked
      // by engagement weighted by recency, which is what we want for
      // "read next" recommendations.
      let primaryError: unknown = null;
      try {
        const response = await fetch(CONFIG.privateApiHost + "/search-api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query, sort: "popularity", hide_low: false, since }),
          signal: withTimeoutSignal(INTERNAL_API_TIMEOUT_MS, signal),
        });
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        const data = (await response.json()) as SearchResponse;
        for (const r of data.results) addUnique(r);
      } catch (err) {
        primaryError = err;
      }

      // Fallback: HiveSense semantic similarity. Only consulted if search-api
      // didn't fill the target (or it failed outright). HiveSense is slower
      // (full-post hydration over a decentralized network) and has no recency
      // bias, so we filter client-side; with `popularity` returning more
      // results from search-api this path is rarely taken now.
      if (collected.length < SIMILAR_ENTRIES_TARGET) {
        try {
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
        } catch (hsErr) {
          // Only throw if BOTH sources failed AND we have nothing to show.
          // Surface the primary error since search-api is the load-bearing
          // source — HiveSense is fallback.
          if (primaryError && collected.length === 0) {
            throw primaryError instanceof Error
              ? primaryError
              : new Error("similar-entries: all sources failed");
          }
        }
      }

      // Edge case: primary failed AND HiveSense wasn't called (only happens
      // if we somehow got entries from a hypothetical third source, which
      // doesn't exist today, so this is defensive).
      if (collected.length === 0 && primaryError) {
        throw primaryError instanceof Error
          ? primaryError
          : new Error("similar-entries: all sources failed");
      }

      return collected;
    },
  });
}

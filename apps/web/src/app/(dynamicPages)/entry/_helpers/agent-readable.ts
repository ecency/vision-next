import { prefetchQuery } from "@/core/react-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { getContentQueryOptions, getProfilesQueryOptions } from "@ecency/sdk";
import { isIndexable, ReputationSource } from "@/utils/entry-indexability";
import { isAuthorBlacklisted } from "@/features/seo/blacklist-check";
import { safeDecodeURIComponent } from "@/utils";
import type { Entry } from "@/entities";

// Re-exported so route handlers have a single import surface for the endpoints.
export { selfUrl, renderEntryMarkdown } from "./entry-agent-format";

/**
 * Shared loader for the agent-readable post endpoints (.md / .json /
 * .discussion.json). One place for the fetch + suppression policy so all three
 * formats agree with each other and with what search engines are shown.
 */

// Edge-cacheable like the entry page's conservative tier; the CF worker/nginx
// absorb load. Public content, so safe to share across all clients.
export const AGENT_CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

// Short negative TTL: a 404 here is usually "suppressed" or "not indexed yet",
// both of which can flip — don't let edges pin it for long.
const NOT_FOUND_CACHE_CONTROL = "public, max-age=0, s-maxage=60";

export type EntrySource = "hive_condenser" | "hive_bridge";

export interface LoadedEntry {
  entry: Entry;
  source: EntrySource;
}

export function agentNotFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": NOT_FOUND_CACHE_CONTROL }
  });
}

/**
 * Fetch a post and return it only if it passes the same indexability gate the
 * entry page uses (blacklist + NSFW + reputation + thin-content). Anything we'd
 * noindex for Googlebot returns null here too → the route handler emits 404.
 *
 * Prefers condenser_api.get_content (carries root_author/root_permlink, needed
 * for accurate container/wave detection); falls back to bridge.get_post. Mirrors
 * generate-entry-metadata.ts so gating decisions can't drift.
 */
export async function loadIndexableEntry(
  rawAuthor: string,
  rawPermlink: string
): Promise<LoadedEntry | null> {
  const author = (rawAuthor || "").replace(/%40/g, "").replace("@", "");
  const permlink = safeDecodeURIComponent(rawPermlink || "").trim();
  if (!author || !permlink) return null;

  let entry: Entry | null = null;
  let source: EntrySource = "hive_condenser";

  try {
    entry = (await prefetchQuery(getContentQueryOptions(author, permlink))) as Entry | null;
  } catch {
    entry = null;
  }

  if (!entry || !entry.body || !entry.created) {
    try {
      entry = (await prefetchQuery(
        EcencyEntriesCacheManagement.getEntryQueryByPath(author, permlink)
      )) as Entry | null;
      source = "hive_bridge";
    } catch {
      entry = null;
    }
  }

  if (!entry || !entry.body || !entry.created) return null;

  let account: ReputationSource = null;
  let accountFetchFailed = false;
  try {
    const profiles = await prefetchQuery(getProfilesQueryOptions([entry.author]));
    account = profiles?.[0] ?? null;
  } catch {
    accountFetchFailed = true;
  }

  // Shared-Redis read; pass a singleton set so isIndexable keeps its
  // injected-blacklist contract (same call shape as generate-entry-metadata).
  const blacklist = (await isAuthorBlacklisted(entry.author)) ? new Set([entry.author]) : undefined;

  if (!isIndexable(entry, account, accountFetchFailed, blacklist)) return null;

  return { entry, source };
}

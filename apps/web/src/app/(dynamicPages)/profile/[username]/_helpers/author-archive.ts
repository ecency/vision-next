import { Entry } from "@/entities";
import { fetchQuery } from "@/core/react-query";
import { getAccountPostsQueryOptions } from "@ecency/sdk";

// Posts per numbered archive page (matches the feed page size).
export const ARCHIVE_PER_PAGE = 20;
// Crawlable depth cap. The Hive bridge is cursor-based (no numeric offset), so
// page N is reached by walking from the start; capping the depth bounds that
// walk (page MAX ≈ ceil(MAX*PER_PAGE / 100) sequential RPCs). 10 pages = 200
// posts/archive, which combined with the sitemap gives Google a deep crawl path
// without an unbounded walk.
export const ARCHIVE_MAX_PAGE = 10;
// Hive bridge caps limit at 100; walk in chunks of 100 to minimize round-trips.
const CHUNK = 100;

/**
 * Slice a numbered page out of an accumulated, in-order post list.
 * `hasNext` is true when at least one post exists beyond this page.
 * Pure — unit-tested without the network.
 */
export function sliceArchivePage(
  all: Entry[],
  page: number,
  perPage = ARCHIVE_PER_PAGE
): { entries: Entry[]; hasNext: boolean } {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return { entries: all.slice(start, end), hasNext: all.length > end };
}

/**
 * Fetch a single numbered archive page for an author's section feed by walking
 * the cursor (start_author/start_permlink is EXCLUSIVE — no overlap/dedup).
 * Returns the page's entries plus whether a further page exists.
 */
export async function fetchAuthorArchivePage(
  username: string,
  section: string,
  page: number
): Promise<{ entries: Entry[]; hasNext: boolean }> {
  const needed = page * ARCHIVE_PER_PAGE + 1; // +1 to detect a following page
  const all: Entry[] = [];
  let startAuthor = "";
  let startPermlink = "";

  while (all.length < needed) {
    const chunk = (await fetchQuery(
      getAccountPostsQueryOptions(username, section, startAuthor, startPermlink, CHUNK)
    )) as unknown as Entry[] | undefined;
    if (!chunk || chunk.length === 0) {
      break;
    }
    all.push(...chunk);
    // Same end-of-feed heuristic the SDK's infinite query uses (length === limit).
    if (chunk.length < CHUNK) {
      break;
    }
    const last = chunk[chunk.length - 1];
    startAuthor = last.author;
    startPermlink = last.permlink;
  }

  return sliceArchivePage(all, page);
}

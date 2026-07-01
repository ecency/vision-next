import { Entry } from "@/entities";
import { fetchQuery } from "@/core/react-query";
import { getPostsRankedQueryOptions } from "@ecency/sdk";

// bridge.get_ranked_posts caps `limit` at 20 and its cursor
// (start_author/start_permlink) is exclusive (verified), so tag/community
// archives use O(1) cursor-token pagination — one 20-post fetch per page.
export const ARCHIVE_PAGE_SIZE = 20;

// Feed/community sorts that get a crawlable archive (content ordering only;
// payout/muted/promoted are not content histories).
export const ARCHIVE_FILTERS = ["created", "trending", "hot"];

export interface ArchiveCursor {
  author: string;
  permlink: string;
}

export function parseArchiveCursor(before?: string): ArchiveCursor | null {
  if (!before) {
    return null;
  }
  const idx = before.indexOf("/");
  if (idx <= 0 || idx >= before.length - 1) {
    return null; // must be "author/permlink"
  }
  return { author: before.slice(0, idx), permlink: before.slice(idx + 1) };
}

export function cursorToken(c: ArchiveCursor): string {
  return `${c.author}/${c.permlink}`;
}

/** A tag page is archivable on content sorts, for a real topic tag only. */
export function isArchivableTag(filter: string, tag: string): boolean {
  return (
    ARCHIVE_FILTERS.includes(filter) &&
    !!tag &&
    tag !== "my" &&
    !tag.startsWith("@") &&
    !tag.startsWith("%40")
  );
}

/**
 * Fetch one ranked-feed archive page (the 20 posts older than `cursor`) for a
 * tag or a community id. O(1) — a single bridge.get_ranked_posts call.
 */
export async function fetchRankedCursorPage(
  sort: string,
  tag: string,
  cursor: ArchiveCursor
): Promise<{ entries: Entry[]; nextCursor: ArchiveCursor | null }> {
  const entries =
    ((await fetchQuery(
      getPostsRankedQueryOptions(sort, cursor.author, cursor.permlink, ARCHIVE_PAGE_SIZE, tag)
    )) as unknown as Entry[] | undefined) ?? [];
  const last = entries[entries.length - 1];
  const nextCursor =
    entries.length === ARCHIVE_PAGE_SIZE && last
      ? { author: last.author, permlink: last.permlink }
      : null;
  return { entries, nextCursor };
}

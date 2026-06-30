import { Entry } from "@/entities";
import { isNsfwEntry } from "@/utils/nsfw-detection";

/**
 * Whether a related post is safe to surface as an on-page internal link.
 * Mirrors the feed's SSR hiding so these crawlable SEO links never point at
 * NSFW posts or mod-muted ("gray") posts.
 */
export function isLinkableRelated(
  entry: Pick<Entry, "category" | "title" | "json_metadata" | "stats">
): boolean {
  if (entry.stats?.gray) {
    return false;
  }
  return !isNsfwEntry(entry);
}

export interface RelatedSource {
  /** Feed query tag: a community id (hive-xxxxx) or a plain tag. */
  tag: string;
  /** Human heading: the community title, or "#tag". Never a raw hive id. */
  section: string;
}

/**
 * Resolve the feed source + heading for the "More in ..." block.
 * Prefers the post's community (queried by id, labelled with its title); falls
 * back to the post's primary tag. Returns null when there is nothing sensible
 * to link, and never surfaces a raw "hive-12345" id as a heading.
 *
 * Pure (no I/O) so it can be unit-tested without the render/fetch chain.
 */
export function resolveRelatedSource(
  entry: Pick<Entry, "category" | "community" | "community_title" | "json_metadata">
): RelatedSource | null {
  const isCommunityId = /^hive-\d+$/.test(entry.category ?? "");
  const tags = entry.json_metadata?.tags;
  const firstTag = Array.isArray(tags)
    ? tags.find(
        // Exclude hive-id-shaped tags so the heading is never a raw "#hive-12345".
        (t): t is string => typeof t === "string" && t.length > 0 && !/^hive-\d+$/.test(t)
      )
    : undefined;

  if (entry.community && entry.community_title) {
    return { tag: entry.community, section: entry.community_title };
  }
  if (!isCommunityId && entry.category) {
    return { tag: entry.category, section: `#${entry.category}` };
  }
  if (firstTag) {
    return { tag: firstTag, section: `#${firstTag}` };
  }
  return null;
}

/**
 * Builds the ecency.com RSS feed URL for a blog or community instance.
 * Returns null if the required identifier is missing.
 */
export function getRssFeedUrl(
  instanceType: string,
  username: string | undefined,
  communityId: string | undefined
): string | null {
  if (instanceType === "community") {
    if (!communityId) return null;
    return `https://ecency.com/created/${communityId}/rss`;
  }
  if (!username) return null;
  return `https://ecency.com/@${username}/rss`;
}

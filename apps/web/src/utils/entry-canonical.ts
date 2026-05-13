import { Entry } from "@/entities";
import defaults from "@/defaults";

/**
 * Returns the canonical URL for an entry.
 *
 * Always self-canonical to `${baseUrl}/@${author}/${permlink}` unless the post
 * explicitly declares its own canonical (e.g. cross-published syndication).
 *
 * Why bare /@author/permlink: the same post is reachable on ecency.com via
 * multiple URL forms (community-prefixed, legacy Steemit categories, bare).
 * Picking one canonical shape consolidates Google's duplicate cluster onto a
 * single URL and stops leaking ranking signals to other frontends, which the
 * older `app`-based cross-frontend canonical was doing — and which Google was
 * silently ignoring anyway when those targets were CSR.
 */
export function entryCanonical(entry: Entry, baseUrl = defaults.base): string | null {
  const canonicalFromMetadata = entry.json_metadata?.canonical_url;
  if (canonicalFromMetadata) {
    return canonicalFromMetadata.replace("https://www.", "https://");
  }

  if (!entry.author || !entry.permlink) {
    return null;
  }

  return `${baseUrl}/@${entry.author}/${entry.permlink}`;
}

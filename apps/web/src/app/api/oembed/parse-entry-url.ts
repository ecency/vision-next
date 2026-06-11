/**
 * Extract author/permlink from one of OUR canonical post URLs. We only serve
 * oEmbed for ecency.com URLs; the post is then fetched from Hive by
 * author/permlink (never by fetching the URL), so there is no SSRF surface.
 * Accepts both the bare "/@author/permlink" and legacy "/category/@author/
 * permlink" forms — the permlink is the segment after "@author".
 */
export function parseEntryUrl(raw: string): { author: string; permlink: string } | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.hostname !== "ecency.com" && !url.hostname.endsWith(".ecency.com")) return null;

  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });

  const authorIndex = segments.findIndex((s) => s.startsWith("@"));
  if (authorIndex === -1) return null;

  const author = segments[authorIndex].slice(1);
  const permlink = segments[authorIndex + 1] ?? "";
  if (!author || !permlink) return null;

  return { author, permlink };
}

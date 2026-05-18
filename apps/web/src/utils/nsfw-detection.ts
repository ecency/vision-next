const NSFW_TAGS = new Set<string>(["nsfw"]);

// Hive community IDs (e.g. "hive-123456") whose posts should always be treated as NSFW.
// Extend as adult-content communities are identified.
const NSFW_COMMUNITIES = new Set<string>([
  "hive-109634", // DPorn
  "hive-125278", // Boudoir photography
  "hive-135681", // Adult AI Artwork
  "hive-189000", // xxx
  "hive-195331", // Porn
  "hive-196493", // NSFW
]);

// Catches legacy posts that deliberately omit the nsfw tag (common Steemit-era pattern).
// Word-boundary match on a conservative stem list; trailing letters allowed so "porn"
// catches "pornstar", "masturbat" catches "masturbation/masturbating", etc.
const NSFW_TITLE_REGEX = /\b(porn|pornstar|nude|xxx|masturbat|erotica?|sextape|fetish)\w*/i;

export interface NsfwCheckableEntry {
  category?: string | null;
  title?: string | null;
  json_metadata?: { tags?: string[] } | null;
}

// Curated NSFW community check — the reliable source of truth. The
// list_communities `is_nsfw` response field is unreliable/stale, so it's
// only ever used as an additive bonus signal alongside this set.
export const isNsfwCommunity = (name: string): boolean => NSFW_COMMUNITIES.has(name);

export const isNsfwEntry = (entry: NsfwCheckableEntry): boolean => {
  const candidates: string[] = [];
  if (entry.category) candidates.push(entry.category);
  const metaTags = entry.json_metadata?.tags;
  if (Array.isArray(metaTags)) {
    for (const t of metaTags) {
      if (typeof t === "string") candidates.push(t);
    }
  }
  for (const raw of candidates) {
    const tag = raw.toLowerCase().trim();
    if (NSFW_TAGS.has(tag)) return true;
    if (NSFW_COMMUNITIES.has(tag)) return true;
  }
  if (entry.title && NSFW_TITLE_REGEX.test(entry.title)) return true;
  return false;
};

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
// Tag variant: tags are single tokens, so the title regex's \b word boundaries
// miss compound forms ("xporn", "softnude"). Match the same stems as substrings
// for bare tags — conservative on a public SFW surface (the tags sitemap).
const NSFW_TAG_REGEX = /(porn|nude|xxx|masturbat|erotic|sextape|fetish)/i;

export interface NsfwCheckableEntry {
  category?: string | null;
  title?: string | null;
  json_metadata?: { tags?: string[] } | null;
}

// Curated NSFW community check — the reliable source of truth. The
// list_communities `is_nsfw` response field is unreliable/stale, so it's
// only ever used as an additive bonus signal alongside this set.
export const isNsfwCommunity = (name: string): boolean => NSFW_COMMUNITIES.has(name);

// True if a bare tag/feed name should be kept off SFW surfaces (e.g. the tags
// sitemap shard). Uses the curated NSFW tag/community sets plus a substring stem
// match (NSFW_TAG_REGEX), so compound single-token forms like "xporn" are
// excluded — not just bare stems the title regex's \b would catch.
export const isNsfwTag = (tag: string): boolean => {
  const t = tag.toLowerCase().trim();
  return NSFW_TAGS.has(t) || NSFW_COMMUNITIES.has(t) || NSFW_TAG_REGEX.test(t);
};

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

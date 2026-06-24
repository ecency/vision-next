/** Required tag for posts containing a DecentMemes template (used for reward attribution). */
export const DECENTMEMES_TAG = "decentmemes";

/** json_metadata schema version for the `decentmemes` block (per the widget spec). */
export const DECENTMEMES_METADATA_VERSION = 2;

/** Frontend identifier stamped into json_metadata so DecentMemes can attribute the source. */
export const DECENTMEMES_FRONTEND = "ecency";

/** Mirrors the editor's tag-count limit so we never push the post over the cap. */
const MAX_TAGS = 10;

/**
 * Append the required `decentmemes` tag without reordering existing tags
 * (tag[0] is the post category) or exceeding the tag-count limit. Returns the
 * original array reference when no change is needed.
 */
export function ensureDecentMemesTag(tags: string[] = []): string[] {
  if (tags.includes(DECENTMEMES_TAG) || tags.length >= MAX_TAGS) {
    return tags;
  }
  return [...tags, DECENTMEMES_TAG];
}

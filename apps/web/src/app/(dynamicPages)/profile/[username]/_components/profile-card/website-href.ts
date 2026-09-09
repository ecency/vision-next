import { parseUrl } from "@/utils/misc";

/**
 * Build an external href from a profile's free-text `website` field, or return
 * null when it cannot form a valid URL.
 *
 * Profiles store arbitrary user input (e.g. "no website for noq"). Rendering
 * such a value into a Next.js <Link> throws during prefetch
 * (ECENCY-NEXT-1GE5 — crashed the followers list), so callers render the raw
 * text as plain text when this returns null.
 */
export function profileWebsiteHref(rawWebsite: string | null | undefined): string | null {
  // `typeof`, not a truthiness test. The declared `string` is a claim from the
  // account's posting_json_metadata, which the SDK JSON.parses and casts
  // without validating a single field, so `website` reaches this line as
  // whatever the account's posting key last published. `.replace` on a number
  // or an object is a TypeError thrown while rendering the profile card, which
  // lives in the profile LAYOUT — above every loading boundary this route has.
  if (typeof rawWebsite !== "string" || rawWebsite === "") return null;
  const href = `https://${rawWebsite.replace(/^(https?|ftp):\/\//, "")}`;
  return parseUrl(href) ? href : null;
}

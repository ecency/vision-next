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
  if (!rawWebsite) return null;
  const href = `https://${rawWebsite.replace(/^(https?|ftp):\/\//, "")}`;
  return parseUrl(href) ? href : null;
}

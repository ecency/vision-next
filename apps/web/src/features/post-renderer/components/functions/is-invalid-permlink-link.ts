import { SECTION_LIST } from "@ecency/render-helper";

/**
 * Returns true when a Hive post path does NOT point at a valid, enhanceable
 * permlink — i.e. it is an image, a profile section (/@author/posts,
 * /@author/wallet, …), or otherwise malformed.
 *
 * Post links may arrive in either the canonical bare form
 * "/@author/permlink" or the legacy category-prefixed form
 * "/category/@author/permlink", so the permlink is located relative to the
 * "@author" segment rather than at a fixed path index.
 */
export function isInvalidPermlinkLink(path: string): boolean {
  try {
    const segments = new URL(`https://ecency.com${path}`).pathname
      .split("/")
      .filter(Boolean);

    // The permlink is the segment immediately following "@author".
    const authorIndex = segments.findIndex((seg) => seg.startsWith("@"));
    const permlink = decodeURIComponent(
      authorIndex !== -1 ? segments[authorIndex + 1] ?? "" : "",
    );

    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(permlink);
    const hasBadChars = /[?#]/.test(permlink);
    const isClean = /^[a-z0-9-]+$/.test(permlink); // Hive-style
    // A profile section (e.g. /@author/posts) is not an enhanceable post.
    const isProfileSection = SECTION_LIST.includes(permlink);

    return !isClean || isImage || hasBadChars || isProfileSection;
  } catch {
    return true;
  }
}

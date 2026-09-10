import type { DeskRow } from "./types";

/**
 * Should the desk cover this row's thumbnail before a curator sees it?
 *
 * Two independent sources, because they fail in opposite directions and neither is enough
 * on its own:
 *
 * - the detector's read of the first image (`signals.nsfw.over`), which is what catches the
 *   posts nobody tagged. Measured over 998 live root posts, 32 of the 33 with an explicit
 *   first image carried no nsfw-ish tag at all.
 * - the post's own `nsfw` tag, which is a self-declaration with no false positives. Those
 *   posts are excluded from the working queues outright, so in practice this arm only fires
 *   on the roster `excluded` lens, which is exactly where a mod goes to look at them.
 *
 * ⛔ Read `over`, never `score`. The threshold lives on the server so it can be retuned in
 * one place, and a null score is UNKNOWN (no image, or the check could not run), never clean.
 */
export function rowNeedsNsfwCover(row: DeskRow): boolean {
  const signals = row.overlay?.signals;
  if (signals && typeof signals === "object" && (signals as { nsfw?: { over?: boolean } }).nsfw?.over === true) {
    return true;
  }
  return (row.tags ?? []).some((tag) => tag?.toLowerCase() === "nsfw");
}

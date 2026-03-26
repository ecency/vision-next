import { hasThreeSpeakEmbed } from "./beneficiary";
import { extractPermlink, linkVideoToHive } from "./api";

/**
 * If `body` contains a 3Speak embed URL, links the uploaded video to the
 * published Hive post so it appears in 3Speak's curated feeds (Shorts, etc.).
 *
 * Call this after a successful Hive broadcast. It is fire-and-forget —
 * failures are logged but never thrown.
 */
export function linkThreeSpeakEmbed(
  body: string,
  opts: {
    hiveAuthor: string;
    hivePermlink: string;
    hiveTitle?: string;
    hiveTags?: string[];
    isEditing?: boolean;
  }
): void {
  if (opts.isEditing) return;
  if (!hasThreeSpeakEmbed(body)) return;

  const embedMatch = body.match(/https?:\/\/[a-z.]*3speak\.tv\/embed[?/][^\s<"']*/);
  if (!embedMatch) return;

  const videoPermlink = extractPermlink(embedMatch[0]);
  if (!videoPermlink) return;

  linkVideoToHive({
    videoPermlink,
    hiveAuthor: opts.hiveAuthor,
    hivePermlink: opts.hivePermlink,
    hiveTitle: opts.hiveTitle,
    hiveTags: opts.hiveTags
  }).catch(() => {}); // non-critical
}

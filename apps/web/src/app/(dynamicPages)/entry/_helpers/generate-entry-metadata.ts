import { accountReputation, parseDate, safeDecodeURIComponent, truncate } from "@/utils";
import { entryCanonical } from "@/utils/entry-canonical";
import { catchPostImage, postBodySummary, isValidPermlink } from "@ecency/render-helper";
import { Metadata } from "next";
import { getAccount, getContent } from "@/api/hive";
import { getPostQuery } from "@/api/queries";
import { getServerAppBase } from "@/utils/server-app-base";
import { FullAccount } from "@/entities";

const NOINDEX_AGE_DAYS = 7;
const NOINDEX_REPUTATION_THRESHOLD = 40;

const shouldApplyNoIndex = (
  account: FullAccount | null,
  fallbackReputation: number
): boolean => {
  if (!account) {
    return false;
  }

  const createdAt = parseDate(account.created ?? new Date().toISOString());
  const ageInDays = Math.abs((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isNewAccount = ageInDays < NOINDEX_AGE_DAYS;

  if (!isNewAccount) {
    return false;
  }

  const reputationScore = accountReputation(account.reputation ?? fallbackReputation);
  const postCount = typeof account.post_count === "number" ? account.post_count : 0;
  const hasLowPostingHistory = postCount <= 3;

  return reputationScore < NOINDEX_REPUTATION_THRESHOLD || hasLowPostingHistory;
};


export async function generateEntryMetadata(
  username: string,
  permlink: string
): Promise<Metadata> {
  const cleanPermlink = safeDecodeURIComponent(permlink).trim();
  const base = await getServerAppBase();
  if (!username || !cleanPermlink || cleanPermlink === "undefined" || !isValidPermlink(cleanPermlink)) {
    console.warn("generateEntryMetadata: Missing author or permlink", { username, permlink });
    return {};
  }
  try {
    const cleanAuthor = username.replace("%40", "");
    let entry = await getPostQuery(cleanAuthor, cleanPermlink).prefetch();

    if (!entry || !entry.body || !entry.created) {
      console.warn("generateEntryMetadata: incomplete, trying fallback getContent", {
        username,
        permlink: cleanPermlink
      });
      try {
        // fallback to direct content API
        entry = await getContent(cleanAuthor, cleanPermlink);
      } catch (e) {
        console.error("generateEntryMetadata: fallback getContent failed", cleanAuthor, cleanPermlink, e);
        return {};
      }

      if (!entry || !entry.body || !entry.created) {
        console.warn("generateEntryMetadata: fallback also failed", { username, permlink: cleanPermlink });
        return {};
      }
    }

    const isComment = !!entry.parent_author;

    let title = truncate(entry.title, 67);
    if (isComment) {
      const rawCommentTitle = truncate(postBodySummary(entry.body, 12), 67);
      title = `@${entry.author}: ${rawCommentTitle}`;
    }

    const summary =
      entry.json_metadata?.description || truncate(postBodySummary(entry.body, 210), 140);

    const image = catchPostImage(entry, 600, 500, "match");
    const urlParts = entry.url.split("#");
    const fullUrl = isComment && urlParts[1] ? `${base}/${urlParts[1]}` : `${base}${entry.url}`;
    const authorUrl = `${base}/@${entry.author}`;
    const createdAt = parseDate(entry.created ?? new Date().toISOString());
    const updatedAt = parseDate(entry.updated ?? entry.last_update ?? entry.created ?? new Date().toISOString());
    const canonical = entryCanonical(entry, false, base);
    const finalCanonical = canonical ?? fullUrl;

    let authorAccount: FullAccount | null = null;
    try {
      authorAccount = await getAccount(entry.author);
    } catch (e) {
      console.warn("generateEntryMetadata: failed to load author account", e);
    }

    const applyNoIndex = shouldApplyNoIndex(authorAccount, entry.author_reputation ?? 0);

    const robots = applyNoIndex ? "noindex, nofollow" : undefined;

    return {
      title,
      description: `${summary} by @${entry.author}`,
      robots,
      openGraph: {
        title,
        description: summary,
        url: fullUrl,
        images: image ? [image] : [],
        type: "article",
        publishedTime: createdAt.toISOString(),
        modifiedTime: updatedAt.toISOString(),
        locale: "en_US",
        siteName: "Ecency",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: summary,
        images: image ? [image] : [],
      },
      other: {
        "article:author": authorUrl,
        "og:updated_time": updatedAt.toISOString(),
      },
      alternates: {
        canonical: finalCanonical,
      },
    };
  } catch (e) {
    console.error("generateEntryMetadata failed:", e, { username, permlink: cleanPermlink });
    return {};
  }
}

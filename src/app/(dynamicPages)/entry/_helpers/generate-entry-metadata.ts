import { parseDate, truncate } from "@/utils";
import { entryCanonical } from "@/utils/entry-canonical";
import { catchPostImage, postBodySummary, isValidPermlink } from "@ecency/render-helper";
import { Metadata } from "next";
import {getContent} from "@/api/hive";
import {getPostQuery} from "@/api/queries";


export async function generateEntryMetadata(username: string, permlink: string): Promise<Metadata> {
  if (!username || !isValidPermlink(permlink)) {
    console.warn("generateEntryMetadata: Missing author or permlink", { username, permlink });
    return {};
  }
  try {
    const cleanAuthor = username.replace("%40", "");
    let entry = await getPostQuery(cleanAuthor, permlink).prefetch();

    if (!entry || !entry.body || !entry.created) {
      console.warn("generateEntryMetadata: incomplete, trying fallback getContent", {
        username,
        permlink
      });
      try {
        // fallback to direct content API
        entry = await getContent(cleanAuthor, permlink);
      } catch (e) {
        console.error("generateEntryMetadata: fallback getContent failed", cleanAuthor, permlink, e);
        return {};
      }

      if (!entry || !entry.body || !entry.created) {
        console.warn("generateEntryMetadata: fallback also failed", { username, permlink });
        return {};
      }
    }

    const isComment = !!entry.parent_author;

    let title = truncate(entry.title, 67);
    if (isComment) {
      const rawCommentTitle = truncate(postBodySummary(entry.body, 12), 67);
      title = `@${entry.author}: ${rawCommentTitle}`;
    }

    const summary = entry.json_metadata?.description
        || truncate(postBodySummary(entry.body, 210), 140);

    const image = catchPostImage(entry, 600, 500, "match")
    const urlParts = entry.url.split("#");
    const fullUrl = isComment && urlParts[1]
        ? `https://ecency.com/${urlParts[1]}`
        : `https://ecency.com${entry.url}`;
    const authorUrl = `https://ecency.com/@${entry.author}`;
    const createdAt = parseDate(entry.created ?? new Date().toISOString());
    const updatedAt = parseDate(entry.updated ?? entry.last_update ?? entry.created ?? new Date().toISOString());
    const canonical = entryCanonical(entry);
    const finalCanonical = canonical ?? fullUrl;

    return {
      title,
      description: `${summary} by @${entry.author}`,
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
    console.error("generateEntryMetadata failed:", e, { username, permlink });
    return {};
  }
}

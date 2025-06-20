import { getContent } from "@/api/hive";
import { parseDate, truncate } from "@/utils";
import { catchPostImage, postBodySummary, isValidPermlink } from "@ecency/render-helper";
import { Metadata } from "next";
import { headers } from 'next/headers';


function toProxiedSizedImage(original: string, size = "600x500") {
  if (!original || !original.startsWith("http")) return "";
  const cleanUrl = original.split("?")[0];
  return `https://images.ecency.com/${size}/${cleanUrl}`;
}

export async function generateEntryMetadata(username: string, permlink: string): Promise<Metadata> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent');
  const referer = requestHeaders.get('referer');
  if (!username || !isValidPermlink(permlink)) {
    console.warn("generateEntryMetadata: Missing username or permlink", { username, permlink, userAgent,
      referer });
    return {};
  }
  try {
    const cleanAuthor = username.replace("%40", "");
    //const entry = await getPostQuery(cleanAuthor, permlink).fetchAndGet();
    const entry = await getContent(cleanAuthor, permlink);

    if (!entry || !entry.body || !entry.created) {
      console.warn("generateEntryMetadata: Incomplete post data", { username, permlink });
      return {};
    }
    const isComment = !!entry.parent_author;

    let title = truncate(entry.title, 67);
    if (isComment) {
      const rawCommentTitle = truncate(postBodySummary(entry.body, 12), 67);
      title = `@${entry.author}: ${rawCommentTitle}`;
    }

    const summary = entry.json_metadata?.description
        || truncate(postBodySummary(entry.body, 210), 140);

    const rawImage = catchPostImage(entry, 600, 500, "match") || "";
    const image = toProxiedSizedImage(rawImage);
    const urlParts = entry.url.split("#");
    const fullUrl = isComment && urlParts[1]
        ? `https://ecency.com/${urlParts[1]}`
        : `https://ecency.com${entry.url}`;
    const authorUrl = `https://ecency.com/@${entry.author}`;
    const createdAt = parseDate(entry.created);
    const updatedAt = parseDate(entry.updated ?? entry.created);

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
    };
  } catch (e) {
    console.error("generateEntryMetadata failed:", e, { username, permlink });
    return {};
  }
}

import { getPost } from "@/api/hive";
import { parseDate, truncate } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { Metadata } from "next";

export async function generateEntryMetadata(username: string, permlink: string): Promise<Metadata> {
  try {
    const entry = await getPost(username, permlink);

    if (!entry || !entry.title || !entry.body || !entry.created) {
      return {};
    }

    const title = truncate(entry.title, 67);
    const summary = entry.json_metadata?.description
        || truncate(postBodySummary(entry.body, 210), 140);

    const image = catchPostImage(entry, 1200, 630, "match") || "";
    const fullUrl = `https://ecency.com${entry.url}`;
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
    console.error("generateEntryMetadata failed:", e);
    return {};
  }
}

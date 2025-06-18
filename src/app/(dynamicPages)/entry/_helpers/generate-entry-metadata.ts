import { getPost } from "@/api/hive";
import { parseDate, truncate } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { Metadata } from "next";

export async function generateEntryMetadata(username: string, permlink: string): Promise<Metadata> {
  const entry = await getPost(username, permlink);

  if (!entry) return {};

  const title = truncate(entry.title, 67);
  const summary = entry.json_metadata?.description
      || truncate(postBodySummary(entry.body, 210), 140);
  const image = catchPostImage(entry, 600, 500, "match");
  const fullUrl = `https://ecency.com${entry.url}`;
  const authorUrl = `https://ecency.com/@${entry.author}`;
  const updatedTime = parseDate(entry.updated).toISOString();

  return {
    title,
    description: `${summary} by @${entry.author}`,
    openGraph: {
      title,
      description: summary,
      url: fullUrl,
      images: [image],
      type: "article",
      publishedTime: parseDate(entry.created).toISOString(),
      modifiedTime: updatedTime,
      locale: "en_US",
      siteName: "Ecency",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: summary,
      images: [image],
    },
    other: {
      "article:author": authorUrl,
      "og:updated_time": updatedTime,
    },
  };
}

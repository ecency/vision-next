import { getPostQuery } from "@/api/queries";
import { getPost } from "@/api/hive";
import { parseDate, truncate } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import {Metadata} from "next";

export async function generateEntryMetadata(username: string, permlink: string): Promise<Metadata> {
  const entry = await getPost(username, permlink);

  if (!entry) return {};

  const title = truncate(entry.title, 67);
  const summary = entry.json_metadata?.description
      || truncate(postBodySummary(entry.body, 210), 140);
  const image = catchPostImage(entry, 600, 500, "match");
  const fullUrl = `https://ecency.com/${entry.url}`;

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
      modifiedTime: parseDate(entry.updated).toISOString(),
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: summary,
      images: [image],
    }
  };
}

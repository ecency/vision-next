import { getPostQuery } from "@/api/queries";
import { parseDate, truncate } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";

export async function generateEntryMetadata(username: string, permlink: string) {
  //const entry = await getPostQuery(username, permlink).prefetch();
  const entry = await getPostQuery(username, permlink).fetchAndGet();

  if (entry) {
    const description = `${
      entry.json_metadata?.description
        ? entry.json_metadata?.description
        : truncate(postBodySummary(entry.body, 210), 140)
    } by @${entry.author}`;
    const tags = entry.json_metadata.tags instanceof Array ? Array.from(new Set(entry.json_metadata.tags))?.filter(
      (t) => !!t
    ) : ['ecency'];
    //const tags =
    //  (entry.json_metadata.tags && Array.from(new Set(entry.json_metadata.tags)))?.filter(
    //    (t) => !!t
    //  ) ?? [];
    return {
      title: truncate(entry.title, 67),
      description,
      openGraph: {
        title: truncate(entry.title, 67),
        description,
        url: entry.url,
        images: [catchPostImage(entry, 600, 500, "match")],
        publishedTime: parseDate(entry.created).toISOString(),
        modifiedTime: parseDate(entry.updated).toISOString(),
        tags
      }
    };
  }
  return {};
}

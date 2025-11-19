import { RssHandler } from "@/features/rss/rss-handler";
import { Entry } from "@/entities";
import RSS from "rss";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { makeEntryPath } from "@/utils";

export abstract class EntriesRssHandler extends RssHandler<Entry> {
  protected convertItem(entry: Entry, base: string): RSS.ItemOptions {
    const path = makeEntryPath(entry.category, entry.author, entry.permlink);
    const url = path === "#" ? base : `${base}${path}`;

    return {
      title: entry.title,
      description: postBodySummary(entry.body, 200),
      url,
      categories: [entry.category],
      author: entry.author,
      date: entry.created,
      enclosure: { url: catchPostImage(entry.body) || "" }
    };
  }
}

import { RssHandler } from "@/features/rss/rss-handler";
import { Entry } from "@/entities";
import RSS from "rss";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import defaults from "@/defaults.json";
import { makeEntryPath } from "@/utils";

export abstract class EntriesRssHandler extends RssHandler<Entry> {
  protected convertItem(entry: Entry): RSS.ItemOptions {
    return {
      title: entry.title,
      description: postBodySummary(entry.body, 200),
      url:
        (() => {
          const path = makeEntryPath(entry.category, entry.author, entry.permlink);
          return path === "#" ? defaults.base : `${defaults.base}${path}`;
        })(),
      categories: [entry.category],
      author: entry.author,
      date: entry.created,
      enclosure: { url: catchPostImage(entry.body) || "" }
    };
  }
}

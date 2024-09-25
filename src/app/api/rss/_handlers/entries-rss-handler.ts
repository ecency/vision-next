import { RssHandler } from "@/app/api/rss/_handlers/rss-handler";
import { Entry } from "@/entities";
import RSS from "rss";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import defaults from "@/defaults.json";

export abstract class EntriesRssHandler extends RssHandler<Entry> {
  protected convertItem(entry: Entry): RSS.ItemOptions {
    return {
      title: entry.title,
      description: postBodySummary(entry.body, 200),
      url: `${defaults.base}${entry.url}`,
      categories: [entry.category],
      author: entry.author,
      date: entry.created,
      enclosure: { url: catchPostImage(entry.body) || "" }
    };
  }
}

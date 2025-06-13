import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { getPostsRankedQuery } from "@/api/queries";

export class FeedRssHandler extends EntriesRssHandler {
  private filter = "";
  private tag = "";
  protected pathname = "";

  constructor(pathname: string, filter: string, tag = "created") {
    super();
    this.pathname = pathname;
    this.filter = filter;
    this.tag = tag;
  }

  protected async fetchData() {
    const data = await getPostsRankedQuery(this.filter, this.tag, 20).fetchAndGet();
    return data.pages?.[0] ?? [];
  }
}

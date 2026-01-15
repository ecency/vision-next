import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { getPostsRankedInfiniteQueryOptions } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";

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
    const data = await getQueryClient().fetchInfiniteQuery(
      getPostsRankedInfiniteQueryOptions(this.filter, this.tag, 20)
    );
    return data.pages?.[0] ?? [];
  }
}

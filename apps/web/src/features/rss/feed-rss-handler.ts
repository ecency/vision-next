import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { resolvePostSort } from "@/features/rss/valid-sorts";
import { getPostsRankedInfiniteQueryOptions } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";

export class FeedRssHandler extends EntriesRssHandler {
  private filter = "";
  private tag = "";
  protected pathname = "";

  constructor(pathname: string, filter: string, tag = "created") {
    super();
    this.pathname = pathname;
    // `filter` is the sort key; crawlers hit /:filter/:tag/rss.xml with
    // arbitrary segments, so clamp to a bridge-accepted sort to avoid an
    // "Unsupported sort" RPCError (mirrors the community handler).
    this.filter = resolvePostSort(filter);
    this.tag = tag;
  }

  protected async fetchData() {
    const data = await getQueryClient().fetchInfiniteQuery(
      getPostsRankedInfiniteQueryOptions(this.filter, this.tag, 20)
    );
    return data.pages?.[0] ?? [];
  }
}

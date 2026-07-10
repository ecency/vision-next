import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { resolvePostSort } from "@/features/rss/valid-sorts";
import { getPostsRankedInfiniteQueryOptions } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";

export class CommunityRssHandler extends EntriesRssHandler {
  private community = "";
  private tag = "";
  protected pathname = "";

  constructor(pathname: string, community: string, tag = "created") {
    super();
    this.pathname = pathname;
    this.community = community;
    // `tag` is the sort key here; clamp unknown crawler-supplied sorts to a
    // bridge-accepted value to avoid an "Unsupported sort" RPCError.
    this.tag = resolvePostSort(tag);
  }

  protected async fetchData() {
    const data = await getQueryClient().fetchInfiniteQuery(
      getPostsRankedInfiniteQueryOptions(this.tag, this.community, 20)
    );
    return data.pages?.[0] ?? [];
  }
}

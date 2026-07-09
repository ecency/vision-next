import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { getPostsRankedInfiniteQueryOptions } from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";

const VALID_SORTS = ["trending", "hot", "created", "payout", "payout_comments", "muted"] as const;

export class CommunityRssHandler extends EntriesRssHandler {
  private community = "";
  private tag = "";
  protected pathname = "";

  constructor(pathname: string, community: string, tag = "created") {
    super();
    this.pathname = pathname;
    this.community = community;
    this.tag = VALID_SORTS.includes(tag as (typeof VALID_SORTS)[number]) ? tag : "created";
  }

  protected async fetchData() {
    const data = await getQueryClient().fetchInfiniteQuery(
      getPostsRankedInfiniteQueryOptions(this.tag, this.community, 20)
    );
    return data.pages?.[0] ?? [];
  }
}

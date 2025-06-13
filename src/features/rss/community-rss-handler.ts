import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { getPostsRankedQuery } from "@/api/queries";

export class CommunityRssHandler extends EntriesRssHandler {
  private community = "";
  private tag = "";
  protected pathname = "";

  constructor(pathname: string, community: string, tag = "created") {
    super();
    this.pathname = pathname;
    this.community = community;
    this.tag = tag;
  }

  protected async fetchData() {
    const data = await getPostsRankedQuery(this.tag, this.community, 20).fetchAndGet();
    return data.pages?.[0] ?? [];
  }
}

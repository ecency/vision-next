import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { getPostsRankedQuery } from "@/api/queries";

export class CommunityRssHandler extends EntriesRssHandler {
  private community = "";
  private tag = "";
  protected pathname = "";

  constructor(pathname: string, community: string, tag: string = "created") {
    super();
    this.pathname = pathname;
    this.community = community;
    this.tag = tag;
  }

  protected async fetchData() {
    const data = await getPostsRankedQuery(this.tag, this.community).fetchAndGet();
    return data.pages?.[0] ?? [];
  }
}

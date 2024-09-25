import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { getAccountPostsQuery } from "@/api/queries";

export class AccountRssHandler extends EntriesRssHandler {
  private author = "";
  private filter = "";
  protected pathname = "";

  constructor(pathname: string, author: string, filter: string = "posts") {
    super();
    this.pathname = pathname;
    this.author = author;
    this.filter = filter;
  }

  protected async fetchData() {
    const data = await getAccountPostsQuery(
      this.author.replace("@", ""),
      this.filter
    ).fetchAndGet();
    return data.pages?.[0] ?? [];
  }
}

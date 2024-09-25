import { EntriesRssHandler } from "@/app/api/rss/_handlers/entries-rss-handler";
import { getAccountPostsQuery } from "@/api/queries";

export class AccountRssHandler extends EntriesRssHandler {
  private author = "";
  protected pathname = "";

  constructor(pathname: string, author: string) {
    super();
    this.pathname = pathname;
    this.author = author;
  }

  protected async fetchData() {
    const data = await getAccountPostsQuery(this.author.replace("@", "")).fetchAndGet();
    return data.pages?.[0] ?? [];
  }
}

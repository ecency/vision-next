import { EntriesRssHandler } from "@/features/rss/entries-rss-handler";
import { getAccountPostsQuery } from "@/api/queries";

export class AccountRssHandler extends EntriesRssHandler {
  private author = "";
  private filter = "";
  protected pathname = "";

  constructor(pathname: string, author: string, filter = "posts") {
    super();
    this.pathname = pathname;
    this.author = author;
    this.filter = filter;
  }

  protected async fetchData() {
    const author = this.author?.trim().replace("@", "");

    if (!author) {
      console.warn("AccountRssHandler: Missing or invalid author");
      return []; // Don't proceed with RPC call
    }
    const data = await getAccountPostsQuery(
      author,
      this.filter,
      20
    ).fetchAndGet();

    return data.pages?.[0] ?? [];
  }
}

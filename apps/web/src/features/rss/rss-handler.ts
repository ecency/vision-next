import RSS from "rss";
import { getServerAppBase } from "@/utils/server-app-base";
import * as Sentry from "@sentry/nextjs";

export abstract class RssHandler<T> {
  protected abstract pathname: string;

  protected abstract fetchData(): Promise<T[]>;

  protected abstract convertItem(item: T, base: string): RSS.ItemOptions;

  async getFeed() {
    const base = await getServerAppBase();
    const feed = new RSS({
      title: "RSS Feed",
      feed_url: `${base}${this.pathname}`,
      site_url: base,
      image_url: `${base}/logo512.png`
    });

    try {
      const data = await this.fetchData();
      data.forEach((item) => feed.item(this.convertItem(item, base)));
    } catch (e) {
      Sentry.captureException(e,{
        extra: {
          pathname: this.pathname,
          handlerClass: this.constructor.name
        }
      });
    }

    return feed;
  }
}

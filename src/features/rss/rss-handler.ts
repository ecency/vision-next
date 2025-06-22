import RSS from "rss";
import defaults from "@/defaults.json";
import * as Sentry from "@sentry/nextjs";

export abstract class RssHandler<T> {
  protected abstract pathname: string;

  protected abstract fetchData(): Promise<T[]>;

  protected abstract convertItem(item: T): RSS.ItemOptions;

  async getFeed() {
    const feed = new RSS({
      title: "RSS Feed",
      feed_url: `${defaults.base}${this.pathname}`,
      site_url: defaults.base,
      image_url: `${defaults.base}/logo512.png`
    });

    try {
      const data = await this.fetchData();
      data.forEach((item) => feed.item(this.convertItem(item)));
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

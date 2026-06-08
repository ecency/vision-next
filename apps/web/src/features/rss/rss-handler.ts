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
      if (!isTransientUpstreamError(e)) {
        Sentry.captureException(e, {
          extra: {
            pathname: this.pathname,
            handlerClass: this.constructor.name
          }
        });
      }
    }

    return feed;
  }
}

// Hive RPC and upstream HTTP layers regularly emit transient connection
// errors when crawlers fan out across many feed paths. They aren't bugs
// in our code, but capturing them drowns out real issues in Sentry.
export function isTransientUpstreamError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { name?: string; code?: string; message?: string };
  // undici / Node net layer
  if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT" || err.code === "UND_ERR_SOCKET")
    return true;
  // AbortController- and Node fetch-timeout-induced errors. Also catches
  // the `Error: aborted` message undici raises on ECONNRESET, since that
  // error carries `name: "AbortError"`.
  if (err.name === "AbortError" || err.name === "TimeoutError") return true;
  const msg = String(err.message ?? "");
  return (
    /Unable to parse endpoint data/i.test(msg) ||
    /HTTP 5\d\d/.test(msg) ||
    /fetch failed/i.test(msg) ||
    /Assert Exception:.*(Category|Tag).*does not exist/i.test(msg)
  );
}

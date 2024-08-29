import { getAccountPostsQuery } from "@/api/queries";
import { NextRequest, NextResponse } from "next/server";
import RSS from "rss";
import defaults from "@/defaults.json";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";

interface Props {
  params: Record<string, string | undefined>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { author, section } = params;

  if (typeof author !== "string" || typeof section !== "string") {
    return NextResponse.json({ status: 404, statusText: "Not Found" });
  }

  const feed = new RSS({
    title: "RSS Feed",
    feed_url: `${defaults.base}${request.url}`,
    site_url: defaults.base,
    image_url: `${defaults.base}/logo512.png`
  });
  try {
    const data = await getAccountPostsQuery(author.replace("@", "")).fetchAndGet();

    data?.pages?.[0].forEach((entry) =>
      feed.item({
        title: entry.title,
        description: postBodySummary(entry.body, 200),
        url: `${defaults.base}${entry.url}`,
        categories: [entry.category],
        author: entry.author,
        date: entry.created,
        enclosure: { url: catchPostImage(entry.body) || "" }
      })
    );
  } catch (e) {}

  return new Response(feed.xml(), { headers: { "Content-Type": "text/xml" } });
}

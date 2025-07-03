import { EcencyEntriesCacheManagement } from "@/core/caches";
import { catchPostImage, postBodySummary, renderPostBody } from "@ecency/render-helper";
import { NextRequest } from "next/server";

interface Props {
  params: Promise<{ author: string; permlink: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { author, permlink } = await params;
    const entry = await EcencyEntriesCacheManagement.getEntryQueryByPath(
      author.replace("%40", "").replace("@", ""),
      permlink
    ).fetchAndGet();

    if (!entry) {
      throw new Error();
    }

    const image = catchPostImage(entry);

    return new Response(
      `
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>${entry.title}</title>
            <meta name="description" content="${postBodySummary(entry.body, 140)}">
            <meta name="article:author" content="https://ecency.com/${author}">
            <meta name="og:updated_time" content="${entry.updated}">
            <meta property="og:title" content="${entry.title}">
            <meta property="og:description" content="${postBodySummary(entry.body, 140)}">
            <meta property="og:url" content="https://ecency.com/${
              entry.category
            }/${author}/${permlink}">
            <meta property="og:image" content="${image}">
            <meta property="article:published_time" content="${entry.created}">
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="${entry.title}">
            <meta name="twitter:description" content="${postBodySummary(entry.body, 140)}">
            <meta name="twitter:image" content="${image}">
        </head>
        <body>
          <main>${renderPostBody(entry)}</main>
        </body>
    </html>
    `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" }
      }
    );
  } catch (e) {
    return new Response("", {
      status: 404
    });
  }
}

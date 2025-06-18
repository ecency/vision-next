import { type NextRequest, NextResponse } from "next/server";
import { generateEntryMetadata } from "@/app/(dynamicPages)/entry/_helpers";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ author: string; permlink: string }> }
) {
    const { author, permlink } = await params;
    const meta = await generateEntryMetadata(author, permlink);

    const og = meta.openGraph || {};
    const twitter = meta.twitter || {};
    const ogImage = Array.isArray(og.images) ? og.images[0] : og.images;
    const twitterImage = Array.isArray(twitter.images) ? twitter.images[0] : twitter.images;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${og.title || meta.title}" />
  <meta property="og:description" content="${og.description || meta.description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:url" content="${og.url}" />
  <meta property="og:locale" content="${og.locale || "en_US"}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${twitter.title || meta.title}" />
  <meta name="twitter:description" content="${twitter.description || meta.description}" />
  <meta name="twitter:image" content="${twitterImage}" />
</head>
<body></body>
</html>`;

    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
    });
}

// Add this to explicitly declare the route export types
export type DynamicRouteParams = {
    params: {
        author: string;
        permlink: string;
    };
};

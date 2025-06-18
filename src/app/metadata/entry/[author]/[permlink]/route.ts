import { NextRequest, NextResponse } from "next/server";
import { generateEntryMetadata } from "@/app/(dynamicPages)/entry/_helpers";

export async function GET(
    req: NextRequest,
    context: { params: { author: string; permlink: string } }
) {
    const { author, permlink } = context.params;

    const meta = await generateEntryMetadata(author, permlink);
    const og = meta.openGraph || {};
    const twitter = meta.twitter || {};

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />
  <meta property="og:type" content="${og.type || "article"}" />
  <meta property="og:title" content="${og.title || meta.title}" />
  <meta property="og:description" content="${og.description || meta.description}" />
  <meta property="og:image" content="${og.images?.[0]}" />
  <meta property="og:url" content="${og.url}" />
  <meta property="og:locale" content="${og.locale || "en_US"}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${twitter.title || meta.title}" />
  <meta name="twitter:description" content="${twitter.description || meta.description}" />
  <meta name="twitter:image" content="${twitter.images?.[0]}" />
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

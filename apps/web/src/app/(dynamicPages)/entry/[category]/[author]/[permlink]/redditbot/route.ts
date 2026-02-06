import { EcencyEntriesCacheManagement } from "@/core/caches";
import { catchPostImage, postBodySummary, renderPostBody, setProxyBase } from "@ecency/render-helper";
import type { SeoContext } from "@ecency/render-helper";
import { accountReputation } from "@/utils";
import { NextRequest } from "next/server";
import type { Entry } from "@/entities";

interface Props {
  params: Promise<{ author: string; permlink: string }>;
}

function isEntry(x: unknown): x is Entry {
  return !!x && typeof x === "object" && "author" in (x as any) && "permlink" in (x as any) && "body" in (x as any);
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { author, permlink } = await params;

    const entryRaw = await EcencyEntriesCacheManagement.getEntryQueryByPath(
        author.replace("%40", "").replace("@", ""),
        permlink
    ).fetchAndGet();

    if (!isEntry(entryRaw)) {
      throw new Error("Entry not found");
    }
    const entry: Entry = entryRaw;

    setProxyBase("https://images.hive.blog");
    const image = catchPostImage(entry); // now correctly typed

    const summary = postBodySummary(entry.body, 140);
    const url = `https://ecency.com/${entry.category}/${author}/${permlink}`;

    return new Response(
        `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${entry.title}</title>
    <meta name="description" content="${summary}">
    <meta name="article:author" content="https://ecency.com/${author}">
    <meta name="og:updated_time" content="${entry.updated}">
    <meta property="og:title" content="${entry.title}">
    <meta property="og:description" content="${summary}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="article:published_time" content="${entry.created}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${entry.title}">
    <meta name="twitter:description" content="${summary}">
    <meta name="twitter:image" content="${image}">
  </head>
  <body>
    <main>${renderPostBody(entry, true, false, 'ecency.com', { authorReputation: accountReputation(entry.author_reputation), postPayout: entry.payout } as SeoContext)}</main>
  </body>
</html>
`,
        { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch {
    return new Response("", { status: 404 });
  }
}

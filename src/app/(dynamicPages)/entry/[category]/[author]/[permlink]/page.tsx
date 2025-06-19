import { getAccountFullQuery, getDeletedEntryQuery, getPostQuery } from "@/api/queries";
import {
  DeletedPostScreen,
  EntryPageContent,
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  MdHandler,
  ReadTime
} from "./_components";
import { getQueryClient } from "@/core/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { generateEntryMetadata } from "../../../_helpers";
import { headers } from "next/headers";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import { parseDate } from "@/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: any) {
  const { author, permlink } = params;
  return generateEntryMetadata(author.replace("%40", ""), permlink);
}

export default async function EntryPage({ params, searchParams }: any) {
  const headersList = await headers(); // ✅ await required in dynamic routes
  const ua = headersList.get("user-agent") || "";
  const isBot = /bot|crawl|spider|reddit|discord|facebook|slack|telegram/i.test(ua);

  const { author: rawAuthor, permlink, category } = params;
  const author = rawAuthor.replace("%40", "");

  const entry = await getPostQuery(author, permlink).prefetch();

  if (
      permlink.startsWith("wave-") ||
      (permlink.startsWith("re-ecencywaves-") && entry?.parent_author === "ecency.waves")
  ) {
    return redirect(`/waves/${author}/${permlink}`);
  }

  // ✅ Special SSR-only HTML for bots like Reddit
  if (isBot && entry) {
    const title = entry.title || "Post";
    const summary = entry.json_metadata?.description || postBodySummary(entry.body, 160);
    const image = catchPostImage(entry, 600, 500, "match") || "";
    const fullUrl = `https://ecency.com${entry.url}`;
    const createdAt = parseDate(entry.created).toISOString();

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta name="description" content=${summary} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content=${title} />
          <meta property="og:description" content=${summary} />
          <meta property="og:url" content=${fullUrl} />
          <meta property="og:image" content=${image} />
          <meta property="article:published_time" content={createdAt} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content=${title} />
          <meta name="twitter:description" content=${summary} />
          <meta name="twitter:image" content=${image} />
        </head>
        <body>
        <p>Bot preview only</p>
        </body>
        </html>`;
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  // 🔁 Normal SSR + hydration for real users
  await getAccountFullQuery(entry?.author).prefetch();

  if (!entry) {
    const deletedEntry = await getDeletedEntryQuery(author, permlink).prefetch();
    if (deletedEntry) {
      return (
          <EntryPageContextProvider>
            <div className="app-content entry-page">
              <div className="the-entry">
                <DeletedPostScreen
                    deletedEntry={deletedEntry}
                    username={author}
                    permlink={permlink}
                />
              </div>
            </div>
          </EntryPageContextProvider>
      );
    }
    return notFound();
  }

  const isEdit = searchParams["edit"];

  return (
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <EntryPageContextProvider>
          <MdHandler />
          <div className="app-content entry-page">
            <ReadTime entry={entry} />
            <div className="the-entry">
              <EntryPageCrossPostHeader entry={entry} />
              <span itemScope itemType="http://schema.org/Article">
              <EntryPageContent
                  category={category}
                  isEdit={isEdit === "true"}
                  entry={entry}
                  rawParam={isEdit ?? ""}
              />
            </span>
            </div>
          </div>
          <EntryPageEditHistory entry={entry} />
        </EntryPageContextProvider>
      </HydrationBoundary>
  );
}

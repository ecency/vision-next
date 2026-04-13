import { prefetchQuery, getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { catchPostImage } from "@ecency/render-helper";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EntryPageContentClient } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-client";
import { EntryPageContentSSR } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-ssr";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateEntryMetadata } from "../../../_helpers";
import {
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  MdHandler
} from "./_components";
import { EntryNotFoundFallback } from "./_components/entry-not-found-fallback";
import { DeletedPostScreen } from "./_components/deleted-post-screen";
import { EntryPageDiscussionsWrapper } from "./_components/entry-page-discussions-wrapper";

interface Props {
  params: Promise<{ author: string; permlink: string; category: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// ISR: post body/title/tags are stable after publishing.
// Live data (votes, comments, payout) is fetched client-side after hydration.
// 5 min revalidation - edge cache (Cloudflare Worker) also caches anonymous HTML for 5 min.
export const revalidate = 300;

export async function generateMetadata(
  props: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { author, permlink } = await props.params;
  if (!permlink || permlink === "undefined") {
    return {};
  }
  return generateEntryMetadata(author.replace("%40", ""), permlink);
}

export default async function EntryPage({ params, searchParams }: Props) {
  const { author: username, permlink, category } = await params;
  const sParams = await searchParams;
  const isRawContent = sParams.raw !== undefined;

  const author = username.replace("%40", "");
  const [entry] = await Promise.all([
    prefetchQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(author, permlink)),
    // Warm the query cache for child components that read account data.
    // Use author from URL params so this runs in parallel with the entry fetch.
    prefetchQuery(getAccountFullQueryOptions(author))
  ]);

  if (
    permlink.startsWith("wave-") ||
    (permlink.startsWith("re-ecencywaves-") && entry?.parent_author === "ecency.waves")
  ) {
    return redirect(`/waves/${author}/${permlink}`);
  }

  if (!entry) {
    // ?history shows deleted post content via comment-history API (client-side)
    if (sParams.history !== undefined) {
      return (
        <EntryPageContextProvider>
          <DeletedPostScreen username={author} permlink={permlink} />
        </EntryPageContextProvider>
      );
    }

    // EntryNotFoundFallback polls the blockchain for freshly published posts
    // that haven't been indexed yet, then falls back to deleted post screen
    return (
      <EntryPageContextProvider>
        <div className="app-content entry-page">
          <div className="the-entry">
            <EntryNotFoundFallback
              username={author}
              permlink={permlink}
            />
          </div>
        </div>
      </EntryPageContextProvider>
    );
  }

  // Preload the post's primary image as the likely LCP element.
  // catchPostImage extracts from json_metadata.image or body, proxied via images.ecency.com.
  const lcpImage = catchPostImage(entry, 600, 500, "match");

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {lcpImage && (
        <link rel="preload" as="image" href={lcpImage} fetchPriority="high" />
      )}
      <EntryPageContextProvider>
        <MdHandler />
        <div className="app-content entry-page bg-fixed bg-contain bg-gradient-to-tr from-blue-dark-sky/20 to-white dark:from-dark-default dark:to-black">
          <div className="the-entry">
            <EntryPageCrossPostHeader entry={entry} />
            <span itemScope itemType="http://schema.org/Article">
              <EntryPageContentSSR entry={entry} isRawContent={isRawContent} />
              <EntryPageContentClient entry={entry} />
              <EntryPageDiscussionsWrapper
                entry={entry}
                category={category}
              />
            </span>
          </div>
        </div>
        <EntryPageEditHistory entry={entry} />
      </EntryPageContextProvider>
    </HydrationBoundary>
  );
}

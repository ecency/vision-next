import { prefetchQuery, getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { buildSrcSet, catchPostImage, IMAGE_SIZES } from "@ecency/render-helper";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EntryPageContentClient } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-client";
import { EntryPageContentSSR } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-ssr";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateEntryMetadata } from "../../../_helpers";
import { makeEntryPath } from "@/utils";
import defaults from "@/defaults.json";
import { JsonLd, buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/features/structured-data";
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
  return generateEntryMetadata(author.replace(/%40/g, ""), permlink);
}

export default async function EntryPage({ params, searchParams }: Props) {
  const { author: username, permlink, category } = await params;
  const sParams = await searchParams;
  const isRawContent = sParams.raw !== undefined;

  const author = username.replace(/%40/g, "");
  const [entry, account] = await Promise.all([
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
  // catchPostImage extracts from json_metadata.image or body, proxied via i.ecency.com.
  // buildSrcSet emits the same `/p/<hash>?...&width=<w>` URLs the in-body LCP
  // <img>'s srcset uses, so pairing it with IMAGE_SIZES (the single source of
  // truth, exported by @ecency/render-helper) makes the high-priority preload
  // resolve to the exact rendition the page renders, not a fixed 600px URL.
  const lcpImage = catchPostImage(entry, 600, 500, "match");
  const lcpImageSrcSet = lcpImage ? buildSrcSet(lcpImage) : "";

  // Structured data: only top-level posts get Article + breadcrumb. Comments
  // carry no headline of their own and would emit an invalid Article.
  const entryPath = makeEntryPath(entry.category, entry.author, entry.permlink);
  const entryUrl = `${defaults.base}${entryPath}`;
  const structuredData = entry.parent_author
    ? null
    : [
        buildArticleJsonLd({ entry, account, url: entryUrl }),
        buildBreadcrumbJsonLd([
          { name: defaults.name, url: defaults.base },
          {
            name: entry.community_title || `#${entry.category}`,
            url: `${defaults.base}/trending/${entry.category}`
          },
          { name: entry.title, url: entryUrl }
        ])
      ];

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {lcpImage && (
        <link
          rel="preload"
          as="image"
          href={lcpImage}
          imageSrcSet={lcpImageSrcSet || undefined}
          imageSizes={lcpImageSrcSet ? IMAGE_SIZES : undefined}
          fetchPriority="high"
        />
      )}
      <EntryPageContextProvider>
        <MdHandler />
        <div className="app-content entry-page bg-fixed bg-contain bg-gradient-to-tr from-blue-dark-sky/20 to-white dark:from-dark-default dark:to-black">
          <div className="the-entry">
            <EntryPageCrossPostHeader entry={entry} />
            {structuredData && <JsonLd data={structuredData} />}
            <EntryPageContentSSR entry={entry} isRawContent={isRawContent} />
            <EntryPageContentClient entry={entry} />
            <EntryPageDiscussionsWrapper entry={entry} category={category} />
          </div>
        </div>
        <EntryPageEditHistory entry={entry} />
      </EntryPageContextProvider>
    </HydrationBoundary>
  );
}

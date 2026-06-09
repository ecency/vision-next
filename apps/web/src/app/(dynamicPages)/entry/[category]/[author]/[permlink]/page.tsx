import { prefetchQuery, getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions, getSimilarEntriesQueryOptions } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EntryPageContentClient } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-client";
import { EntryPageContentSSR } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-ssr";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateEntryMetadata } from "../../../_helpers";
import defaults from "@/defaults.json";
import { getServerAppBase } from "@/utils/server-app-base";
import { entryCanonical } from "@/utils/entry-canonical";
import { JsonLd, buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/features/structured-data";
import {
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  EntryRenderBoundary,
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
            <EntryNotFoundFallback username={author} permlink={permlink} />
          </div>
        </div>
      </EntryPageContextProvider>
    );
  }

  // Server-prefetch "Read next" so the strip is in the SSR HTML (discoverable
  // by crawlers) and renders instantly after hydration. Top-level posts only —
  // comments don't show the strip. Degrades gracefully: the prefetch is bounded
  // by the SSR timeout, and the client refetches if it doesn't resolve in time.
  if (!entry.parent_author) {
    await prefetchQuery(
      getSimilarEntriesQueryOptions({
        author: entry.author,
        permlink: entry.permlink,
        title: entry.title,
        body: entry.body,
        json_metadata: { tags: entry.json_metadata?.tags }
      })
    );
  }

  // No explicit LCP <link rel="preload"> here: the in-body LCP image is rendered
  // as a <picture> (avif/webp/match) by render-helper with fetchpriority="high"
  // on the <img>, so the preload scanner discovers and prioritizes it from the
  // SSR HTML. A single typed (match) preload would mismatch the avif <source>
  // the browser actually picks and double-download the LCP image (a typed image
  // preload does not stop at the first supported source the way <picture> does).
  // A future avif-typed preload would need the raw first-image URL to gate on
  // picture-eligibility (catchPostImage returns an already-proxified URL).

  // Structured data: only top-level posts get Article + breadcrumb. Comments
  // carry no headline of their own and would emit an invalid Article.
  // Use the canonical bare /@author/permlink URL (matches generateEntryMetadata)
  // rather than the category-prefixed path, which only 307-redirects to it.
  const base = (await getServerAppBase()).replace(/\/+$/, "");
  const entryUrl = entryCanonical(entry, base) ?? `${base}/@${entry.author}/${entry.permlink}`;
  const structuredData = entry.parent_author
    ? null
    : [
        buildArticleJsonLd({ entry, account, url: entryUrl, base }),
        buildBreadcrumbJsonLd([
          { name: defaults.name, url: base },
          {
            name: entry.community_title || `#${entry.category}`,
            url: `${base}/trending/${entry.category}`
          },
          { name: entry.title, url: entryUrl }
        ])
      ];

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <EntryPageContextProvider>
        <MdHandler />
        <div className="app-content entry-page bg-fixed bg-contain bg-gradient-to-tr from-blue-dark-sky/20 to-white dark:from-dark-default dark:to-black">
          <div className="the-entry">
            <EntryPageCrossPostHeader entry={entry} />
            {structuredData && <JsonLd data={structuredData} />}
            <EntryRenderBoundary>
              <EntryPageContentSSR entry={entry} isRawContent={isRawContent} />
              <EntryPageContentClient entry={entry} />
              <EntryPageDiscussionsWrapper entry={entry} category={category} />
            </EntryRenderBoundary>
          </div>
        </div>
        <EntryPageEditHistory entry={entry} />
      </EntryPageContextProvider>
    </HydrationBoundary>
  );
}

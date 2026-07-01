import { Suspense } from "react";
import { prefetchQuery, getQueryClient } from "@/core/react-query";
import { getAccountFullQueryOptions, getSimilarEntriesQueryOptions } from "@ecency/sdk";
import {
  buildPictureSources,
  buildSrcSet,
  catchPostImage,
  getEntryImageRawUrl,
  IMAGE_SIZES
} from "@ecency/render-helper";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EntryPageContentClient } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-client";
import { EntryPageContentSSR } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-ssr";
import { EntryPageBreadcrumb } from "./_components/entry-page-breadcrumb";
import { buildEntryBreadcrumbs } from "./_components/entry-breadcrumbs";
import { EntryPageMoreFromAuthor } from "./_components/entry-page-more-from-author";
import { EntryPageMoreInTag } from "./_components/entry-page-more-in-tag";
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

  // Preload the post's primary image as the likely LCP element, matching the
  // exact rendition the in-body <picture>/<img> will request so the preload is
  // a head start, not a double download. (getEntryImageRawUrl shares the
  // renderer's decodeImageSrc, so the proxy hash is byte-identical to the body.)
  //   - Eligible cover (static raster): the body renders <picture> and an
  //     avif-capable browser picks the avif <source>. Preload the SAME avif
  //     srcset, typed image/avif. We deliberately emit ONLY the avif preload:
  //     unlike <picture>, multiple typed image preloads do NOT "pick the first
  //     supported one" — a browser that supports both avif and webp would fetch
  //     BOTH, double-downloading the LCP on the majority of clients. A match
  //     preload would likewise mismatch the avif <source>. The trade-off: the
  //     shrinking webp-only/no-avif tail (Safari 16.0–16.3, very old Chromium)
  //     skips the typed preload and instead loads the body <picture>'s webp via
  //     the in-body fetchpriority="high" <img> — no head start, but a far
  //     smaller image than develop's CDN-cross-served match preload, so net LCP
  //     for that cohort is not worse.
  //   - Ineligible cover (gif/svg/extensionless/already-proxified): the body
  //     renders a bare format=match <img>, so preload that.
  //   - rawCover === null (the fast path couldn't resolve the cover URL — e.g. a
  //     parenthesized markdown image URL the MD parser bails on): emit NO preload.
  //     The body may still render an avif <picture>, so a match preload here would
  //     mismatch the avif <source> and double-download the LCP. The in-body
  //     fetchpriority="high" <img> still prioritizes the actual fetch.
  const rawCover = getEntryImageRawUrl(entry);
  const coverPicture = rawCover ? buildPictureSources(rawCover) : null;
  const lcpMatch = catchPostImage(entry, 600, 500, "match");
  const lcpMatchSrcSet = lcpMatch ? buildSrcSet(lcpMatch) : "";

  // Structured data: only top-level posts get Article + breadcrumb. Comments
  // carry no headline of their own and would emit an invalid Article.
  // Use the canonical bare /@author/permlink URL (matches generateEntryMetadata)
  // rather than the category-prefixed path, which only 307-redirects to it.
  const base = (await getServerAppBase()).replace(/\/+$/, "");
  const entryUrl = entryCanonical(entry, base) ?? `${base}/@${entry.author}/${entry.permlink}`;
  // Breadcrumb trail shared by the visible <nav> and the BreadcrumbList JSON-LD
  // so the two never drift (and never surface a raw hive-id section).
  const breadcrumbs = buildEntryBreadcrumbs(entry, {
    siteName: defaults.name,
    base,
    entryUrl
  });

  const structuredData = entry.parent_author
    ? null
    : [
        buildArticleJsonLd({ entry, account, url: entryUrl, base }),
        buildBreadcrumbJsonLd(breadcrumbs.map((c) => ({ name: c.name, url: c.url })))
      ];

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {coverPicture ? (
        <link
          rel="preload"
          as="image"
          type="image/avif"
          imageSrcSet={coverPicture.avif}
          imageSizes={IMAGE_SIZES}
          fetchPriority="high"
        />
      ) : rawCover && lcpMatch ? (
        // Ineligible cover with a resolved raw URL → the body renders a bare
        // format=match <img>; preload the matching rendition. (When rawCover is
        // null we intentionally emit nothing — see the comment above.)
        <link
          rel="preload"
          as="image"
          href={lcpMatch}
          imageSrcSet={lcpMatchSrcSet || undefined}
          imageSizes={lcpMatchSrcSet ? IMAGE_SIZES : undefined}
          fetchPriority="high"
        />
      ) : null}
      <EntryPageContextProvider>
        <MdHandler />
        <div className="app-content entry-page bg-fixed bg-contain bg-gradient-to-tr from-blue-dark-sky/20 to-white dark:from-dark-default dark:to-black">
          <div className="the-entry">
            <EntryPageCrossPostHeader entry={entry} />
            {breadcrumbs.length > 0 && <EntryPageBreadcrumb items={breadcrumbs} />}
            {structuredData && <JsonLd data={structuredData} />}
            <EntryRenderBoundary>
              <EntryPageContentSSR entry={entry} isRawContent={isRawContent} />
              {/* Durable, server-rendered internal links so crawlers can reach
                  the author's other posts and the community/tag beyond the
                  sitemap. Each renders nothing when there's too little to link.
                  Wrapped in Suspense so their (bounded) feed fetches stream as a
                  later chunk instead of gating the post body's flush / LCP — the
                  <a href> links still ship in the same streamed HTML response. */}
              <Suspense fallback={null}>
                <EntryPageMoreFromAuthor entry={entry} />
              </Suspense>
              <Suspense fallback={null}>
                <EntryPageMoreInTag entry={entry} />
              </Suspense>
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

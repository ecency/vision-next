import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions, getDeletedEntryQueryOptions } from "@ecency/sdk";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { EntryPageContentClient } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-client";
import { EntryPageContentSSR } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-content-ssr";
import { getQueryClient } from "@/core/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { generateEntryMetadata } from "../../../_helpers";
import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import {
  DeletedPostScreen,
  EntryPageContextProvider,
  EntryPageCrossPostHeader,
  EntryPageEditHistory,
  MdHandler
} from "./_components";
import { EntryPageDiscussionsWrapper } from "./_components/entry-page-discussions-wrapper";

interface Props {
  params: Promise<{ author: string; permlink: string; category: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// Enable ISR with 60 second revalidation - posts don't change often after publishing
// This provides massive performance improvement for one of the most visited page types
export const revalidate = 60;

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
  const entry = await prefetchQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(author, permlink));
  const cookiesStore = await cookies();
  const activeUsername = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;

  if (
    permlink.startsWith("wave-") ||
    (permlink.startsWith("re-ecencywaves-") && entry?.parent_author === "ecency.waves")
  ) {
    return redirect(`/waves/${author}/${permlink}`);
  }

  if (entry?.author) {
    await prefetchQuery(getAccountFullQueryOptions(entry.author));
  }

  if (!entry) {
    // Prefetch deleted entry data for SSR (component will handle loading/error states)
    await prefetchQuery(getDeletedEntryQueryOptions(author, permlink));

    return (
      <EntryPageContextProvider>
        <div className="app-content entry-page">
          <div className="the-entry">
            <DeletedPostScreen
              username={author}
              permlink={permlink}
            />
          </div>
        </div>
      </EntryPageContextProvider>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <EntryPageContextProvider>
        <MdHandler />
        <div className="app-content entry-page bg-fixed bg-contain bg-gradient-to-tr from-blue-dark-sky/20 to-white dark:from-dark-default dark:to-black">
          <div className="the-entry">
            <EntryPageCrossPostHeader entry={entry} />
            <span itemScope itemType="http://schema.org/Article">
              <EntryPageContentSSR entry={entry} isRawContent={isRawContent} />
              <EntryPageContentClient entry={entry} category={category} />
              <EntryPageDiscussionsWrapper
                entry={entry}
                category={category}
                activeUsername={activeUsername}
              />
            </span>
          </div>
        </div>
        <EntryPageEditHistory entry={entry} />
      </EntryPageContextProvider>
    </HydrationBoundary>
  );
}

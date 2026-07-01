import { ProfileEntriesList, ProfileSearchContent } from "../_components";
import { ProfileEntriesArchive } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-archive";
import {
  fetchAuthorCursorPage,
  archiveCursor,
  cursorToken
} from "@/app/(dynamicPages)/profile/[username]/_helpers/author-archive";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound, redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery, fetchInfiniteQuery } from "@/core/react-query";
import { stripActiveVotesFromDehydratedState } from "@/core/react-query/strip-active-votes";
import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { getAccountFullQueryOptions, getSearchApiInfiniteQueryOptions } from "@ecency/sdk";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { Entry, SearchResult } from "@/entities";
import type { InfiniteData } from "@tanstack/react-query";
import type { SearchResponse } from "@ecency/sdk";

interface Props {
  params: Promise<{ username: string; section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username, section } = await props.params;
  const { query, before } = await props.searchParams;
  const cursor = archiveCursor(section, { query, before });
  return generateProfileMetadata(
    username.replace(/%40/g, ""),
    section,
    cursor ? cursorToken(cursor) : undefined
  );
}

export default async function Page({ params, searchParams }: Props) {
  const { username: usernameParam, section } = await params;
  const { query: searchParam, before: beforeParam } = await searchParams;
  const loggedInUser = (await cookies()).get(ACTIVE_USER_COOKIE_NAME)?.value;

  const username = usernameParam.replace(/%40/g, "");

  // Cursor archive page (/@author/<section>?before=<author>/<permlink>): O(1),
  // one fetch of the 20 posts older than the cursor. Page 1 is the clean,
  // query-less default view; archiveCursor() returns null there.
  const cursor = archiveCursor(section, { query: searchParam, before: beforeParam });
  if (cursor) {
    const basePath = `/@${username}/${section}`;
    const [account, archive] = await Promise.all([
      prefetchQuery(getAccountFullQueryOptions(username)),
      fetchAuthorCursorPage(username, section, cursor)
    ]);
    if (!account) {
      return notFound();
    }
    // Stale/invalid cursor (nothing older than it): send to the clean first page.
    if (archive.entries.length === 0) {
      return redirect(basePath);
    }
    return (
      <HydrationBoundary
        state={stripActiveVotesFromDehydratedState(dehydrate(getQueryClient()), loggedInUser)}
      >
        <ProfileEntriesArchive
          section={section}
          account={account}
          entries={archive.entries}
          olderCursor={archive.nextCursor ? cursorToken(archive.nextCursor) : null}
          currentUser={loggedInUser}
        />
      </HydrationBoundary>
    );
  }

  const [account, searchPages, prefetchedFeed] = await Promise.all([
    prefetchQuery(getAccountFullQueryOptions(username)),
    searchParam
      ? fetchInfiniteQuery(
          getSearchApiInfiniteQueryOptions(
            `${searchParam} author:${username} type:post`,
            "newest",
            false
          )
        )
      : Promise.resolve(undefined),
    searchParam
      ? Promise.resolve(undefined)
      : prefetchGetPostsFeedQuery(section, `@${username}`)
  ]);

  if (account?.profile.pinned) {
    await prefetchQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(
      username,
      account.profile.pinned
    ));
  }

  const firstPage = searchPages?.pages?.[0] as SearchResponse | undefined;
  // SDK SearchResult is a subset of the app's SearchResult; the API returns the full shape
  const results = (firstPage?.results ?? []) as unknown as SearchResult[];

  const searchData = results.length > 0
    ? results
        .slice()
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    : undefined;
  const initialFeed = prefetchedFeed as InfiniteData<Entry[], unknown> | undefined;

  if (!account || !["", "posts", "comments", "replies", "blog"].includes(section)) {
    return notFound();
  }

  return (
    <HydrationBoundary state={stripActiveVotesFromDehydratedState(dehydrate(getQueryClient()), loggedInUser)}>
      {searchData && searchData.length > 0 ? (
        <ProfileSearchContent items={searchData} />
      ) : (
        <ProfileEntriesList
          section={section}
          account={account}
          initialFeed={initialFeed}
          currentUser={loggedInUser}
        />
      )}
    </HydrationBoundary>
  );
}

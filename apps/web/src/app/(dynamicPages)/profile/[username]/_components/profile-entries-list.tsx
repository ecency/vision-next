import { Entry, FullAccount } from "@/entities";
import { EntryListContent } from "@/features/shared";
import React from "react";
import { getPostsFeedQueryData } from "@/api/queries";
import { getQueryData } from "@/core/react-query";
import { stripActiveVotesFromValue } from "@/core/react-query/strip-active-votes";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { ProfileEntriesInfiniteList } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-infinite-list";
import { EntryArchivePager } from "@/features/shared/entry-archive-pager";
import {
  ARCHIVE_PER_PAGE,
  ARCHIVE_MAX_PAGE
} from "@/app/(dynamicPages)/profile/[username]/_helpers/author-archive";
import type { InfiniteData } from "@tanstack/react-query";

// Content sections that expose a crawlable numbered archive.
const ARCHIVE_SECTIONS = ["posts", "blog", "comments", "replies"];

interface Props {
  section: string;
  account: FullAccount;
  initialFeed?: InfiniteData<Entry[], unknown>;
  currentUser?: string;
}

function shouldShowPinnedEntry(account: FullAccount, section: string) {
  return (
    ["blog", "posts", ""].includes(section) &&
    (((account as FullAccount)?.profile && (account as FullAccount)?.profile?.pinned) ||
      ((account as FullAccount)?.profile && (account as FullAccount)?.profile?.pinned !== "none"))
  );
}

export async function ProfileEntriesList({ section, account, initialFeed, currentUser }: Props) {
  const pinnedEntry = shouldShowPinnedEntry(account, section)
    ? getQueryData(EcencyEntriesCacheManagement.getEntryQueryByPath(account.name, account.profile?.pinned))
    : undefined;

  const prefetchedFeed =
    initialFeed ??
    (getPostsFeedQueryData(section, `@${account.name}`) as InfiniteData<Entry[], unknown> | undefined);

  const feedPages = prefetchedFeed?.pages ?? [];
  const initialPageEntries =
    (feedPages[0] as Entry[] | undefined)?.filter(
      (item: Entry) => item.permlink !== account.profile?.pinned
    ) ?? [];
  const entryList = [...initialPageEntries];

  if (pinnedEntry) {
    entryList.unshift(pinnedEntry);
  }

  // Strip active_votes from the entries serialized into the (client) EntryListItem
  // props for anonymous requests — covers both the feed entries and the
  // separately-fetched pinned entry. Logged-in keeps the full arrays so the
  // "you voted" highlight works.
  const entries = stripActiveVotesFromValue(entryList, currentUser);

  const initialPageEntriesCount = initialPageEntries.length;
  const initialEntriesCount = entryList.length;
  const initialDataLoaded = Boolean(initialFeed) || feedPages.length > 0;

  return (
    <>
      <ProfileEntriesLayout section={section} username={account.name}>
        <EntryListContent
          account={account}
          username={`@${account.name}`}
          loading={!initialDataLoaded && initialEntriesCount === 0}
          entries={entries}
          sectionParam={section}
          isPromoted={false}
          showEmptyPlaceholder={false}
        />
        <ProfileEntriesInfiniteList
          section={section}
          account={account}
          initialEntriesCount={initialEntriesCount}
          initialPageEntriesCount={initialPageEntriesCount}
          initialDataLoaded={initialDataLoaded}
        />
        {/* Crawlable entry into the numbered archive: infinite scroll is the JS
            enhancement, this pager is the no-JS/crawler path to older posts. */}
        {ARCHIVE_SECTIONS.includes(section) && initialPageEntriesCount >= ARCHIVE_PER_PAGE && (
          <EntryArchivePager
            basePath={`/@${account.name}/${section}`}
            page={1}
            hasNext={true}
            maxPage={ARCHIVE_MAX_PAGE}
          />
        )}
      </ProfileEntriesLayout>
    </>
  );
}

"use client";

import { ListStyle } from "@/enums";
import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from "react";
import { useGlobalStore } from "@/core/global-store";
import { usePostsFeedQuery } from "@/api/queries";
import { Entry, SearchResponse } from "@/entities";
import { EntryListContent } from "@/features/shared/entry-list-content";
import { LinearProgress } from "@/features/shared/linear-progress";
import { UserAvatar } from "@/features/shared/user-avatar";
import {
  getAccountPostsQueryOptions,
  getPostsRankedQueryOptions,
  QueryKeys
} from "@ecency/sdk";
import { getQueryClient } from "@/core/react-query";
import { withSlimPageEntries } from "@/core/entries/slim-entry";
import { mergePreservingHint } from "@/core/entries/language-hint";
import type { InfiniteData } from "@tanstack/react-query";

const MAX_PENDING = 20;
const POLL_INTERVAL_MS = 30000;
// Explicit rather than inherited: fetchQuery honours staleTime, so this is what
// actually decides how often the poll reaches the network. It matches the
// app-wide default that has governed this poll all along, stated here so that
// changing the global default cannot silently change this feed's request rate.
const POLL_STALE_TIME_MS = 60000;
const MAX_AVATARS = 5;

interface Props {
  filter: string;
  tag: string;
  observer?: string;
  /** Rendered above the post list, outside the list surface (tag header, onboarding). */
  before?: ReactNode;
  /** Rendered below the post list, outside the list surface (archive pager). */
  after?: ReactNode;
}

// Union for a single page
type Page = Entry[] | SearchResponse;

/** Ranked lists whose top moves often enough to be worth watching. */
const POLLED_RANKED_FILTERS = ["trending", "hot", "created"];

/**
 * What a "new posts" poll asks for on this feed, and the cache entry its answer
 * merges into, or null for a feed the chip does not watch.
 *
 * Following is the reader's own chronological feed: it comes from a different
 * bridge method than the ranked lists and lives under a different key, so it
 * needs both halves of this, not just a place in the filter list. It is also
 * the feed the chip is most useful on, since a post appearing at the top is
 * simply someone they follow publishing, not a re-ranking.
 */
function resolvePollTarget(filter: string, tag: string, observer: string) {
  // Same derivation the feed query itself uses for `@user` tags.
  const account = tag.startsWith("@") || tag.startsWith("%40")
    ? tag.replace("@", "").replace(/%40/g, "")
    : "";

  if (account) {
    return {
      feedKey: QueryKeys.posts.accountPosts(account, filter, 20, observer),
      options: withSlimPageEntries(
        getAccountPostsQueryOptions(account, filter, "", "", MAX_PENDING, observer)
      )
    };
  }

  if (POLLED_RANKED_FILTERS.includes(filter)) {
    return {
      feedKey: QueryKeys.posts.postsRanked(filter, tag, 20, observer),
      options: withSlimPageEntries(
        getPostsRankedQueryOptions(filter, "", "", MAX_PENDING, tag, observer)
      )
    };
  }

  return null;
}

export function FeedLayout(props: PropsWithChildren<Props>) {
  const listStyle = useGlobalStore((s) => s.listStyle);

  // 👇 Make the hook result explicitly an infinite query over Page
  const result = usePostsFeedQuery(props.filter, props.tag, props.observer);
  const isFetching = result.isFetching;
  const data = result.data as InfiniteData<Page, unknown> | undefined;

  const [pending, setPending] = useState<Entry[]>([]);
  const [extra, setExtra] = useState<Entry[]>([]);
  const latest = useRef<Entry | null>(null);

  const firstPageEntries: Entry[] =
      Array.isArray(data?.pages?.[0])
          ? (data!.pages![0] as Entry[])
          : ((data?.pages?.[0] as any)?.items ?? (data?.pages?.[0] as any)?.results ?? []);

  useEffect(() => {
    const top =
        extra.find((e) => !e.stats?.is_pinned) ||
        firstPageEntries.find((e) => !e.stats?.is_pinned) ||
        null;

    if (top) {
      latest.current = top;
    }
  }, [data, extra]); // firstPageEntries is derived from data, so data is enough

  useEffect(() => {
    if (!props.observer) return;

    const target = resolvePollTarget(props.filter, props.tag, props.observer);
    if (!target) return;

    const queryClient = getQueryClient();
    const queryKey = target.feedKey;

    // A hidden tab has nobody to show a "new posts" chip to, and this is not a
    // cheap tick: each fetch is a full 20-post ranked page, 257 KB gzipped on
    // /trending, and it runs for anonymous readers too. Left running, a tab
    // parked in the background all afternoon pulls about 10 MB an hour to
    // maintain a count nobody is looking at.
    // A poll already awaiting fetchQuery outlives clearInterval, and would then
    // write pending/extra state into an unmounted feed.
    let cancelled = false;

    const poll = async (): Promise<void> => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      // Slim, like the feed this merges into: the merge below spreads these rows
      // over the cached ones, so a full row here would put every body back into
      // the feed cache 30 seconds after the page loaded.
      //
      // Own cache identity: this SDK page key is also read by deck columns,
      // which render whole posts. The merge below reads the returned value, not
      // the cache, so the marker costs nothing here.
      const pollOptions = target.options;
      let resp: Entry[] | undefined;
      try {
        resp = await queryClient.fetchQuery({
          ...pollOptions,
          staleTime: POLL_STALE_TIME_MS
        });
      } catch {
        // A poll tick is best effort. fetchQuery rejects on a node fault and on
        // an authoritative answer alike (hivemind refuses a tag it has never
        // indexed with a -32602 assert). The feed itself already renders empty
        // for such a tag, so the poll behind it stays quiet too instead of
        // surfacing as an unhandled rejection every 30 seconds. The interval
        // keeps ticking, so a node hiccup gets another chance next tick.
        return;
      }
      if (cancelled || !resp || resp.length === 0) return;

      // Update existing entries with latest stats
      queryClient.setQueryData<InfiniteData<Entry[] | SearchResponse, unknown>>(queryKey, (old) => {
        if (!old) return old;
        const map = new Map(resp.map((e) => [`${e.author}-${e.permlink}`, e]));
        return {
          ...old,
          pages: old.pages.map((page) => {
            if (Array.isArray(page)) {
              return (page as Entry[]).map((item) => {
                const updated = map.get(`${item.author}-${item.permlink}`);
                return updated ? mergePreservingHint(item, updated) : item;
              });
            }
            return page; // SearchResponse: leave as-is
          }),
        };
      });

      // Update any “extra” entries we’re showing above the list
      setExtra((p) =>
          p.map((item) => {
            const updated = resp.find(
                (e) => e.author === item.author && e.permlink === item.permlink
            );
            return updated ? mergePreservingHint(item, updated) : item;
          })
      );

      // Compute fresh entries newer than the last seen “top”
      const last = latest.current;
      const fresh: Entry[] = [];
      for (const e of resp) {
        if (e.stats?.is_pinned) continue;
        if (last && e.author === last.author && e.permlink === last.permlink) break;
        fresh.push(e);
      }
      if (fresh.length > 0) {
        setPending(fresh.slice(0, MAX_PENDING));
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    // Catch up as soon as the reader comes back, rather than making them wait
    // out the rest of an interval for a chip that is already out of date.
    const onVisible = (): void => {
      if (document.visibilityState === "visible") {
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [props.filter, props.tag, props.observer]);

  const revealNew = () => {
    setExtra((p) => [...pending, ...p]);
    setPending([]);
  };

  return (
      <div className="entry-list">
        {pending.length > 0 && (
            <div
                className="fixed top-[60px] md:top-[76px] left-1/2 -translate-x-1/2 z-50 bg-blue-dark-sky text-white px-3 py-1 rounded-full flex items-center gap-2 cursor-pointer shadow-lg"
                role="button"
                tabIndex={0}
                onClick={revealNew}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    revealNew();
                  }
                }}
            >
              <div className="flex -space-x-1">
                {pending.slice(0, MAX_AVATARS).map((e) => (
                    <UserAvatar
                        key={`${e.author}-${e.permlink}`}
                        username={e.author}
                        size="xsmall"
                        className="border-2 border-blue-dark-sky"
                    />
                ))}
              </div>
              <span>
            {pending.length} new {pending.length > 1 ? "posts" : "post"}
          </span>
            </div>
        )}

        {props.before}

        <div className={`entry-list-body ${listStyle === ListStyle.grid ? "grid-view" : ""}`}>
          {isFetching && <LinearProgress />}

          {extra.length > 0 && (
              <EntryListContent
                  username=""
                  loading={false}
                  entries={extra}
                  sectionParam={props.filter}
                  isPromoted={false}
                  showEmptyPlaceholder={false}
              />
          )}

          {props.children}
        </div>

        {props.after}
      </div>
  );
}

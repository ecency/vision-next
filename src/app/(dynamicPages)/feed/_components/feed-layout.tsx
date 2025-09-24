"use client";

import { ListStyle } from "@/enums";
import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useGlobalStore } from "@/core/global-store";
import { usePostsFeedQuery } from "@/api/queries";
import { Entry, SearchResponse } from "@/entities";
import { LinearProgress, UserAvatar, EntryListContent } from "@/features/shared";
import { getPostsRanked } from "@/api/bridge";
import { getQueryClient, QueryIdentifiers } from "@/core/react-query";
import { InfiniteData } from "@tanstack/react-query";

const MAX_PENDING = 20;
const MAX_AVATARS = 5;

interface Props {
  filter: string;
  tag: string;
  observer?: string;
}

export function FeedLayout(props: PropsWithChildren<Props>) {
  const listStyle = useGlobalStore((s) => s.listStyle);
  const { isLoading, data } = usePostsFeedQuery(props.filter, props.tag, props.observer);
  const [pending, setPending] = useState<Entry[]>([]);
  const [extra, setExtra] = useState<Entry[]>([]);
  const [now, setNow] = useState(Date.now());
  const latest = useRef<Entry | null>(null);

  useEffect(() => {
    const top =
      extra.find((e) => !e.stats?.is_pinned) ||
      ((data?.pages?.[0] as Entry[] | undefined)?.find((e) => !e.stats?.is_pinned) ?? null);
    if (top) {
      latest.current = top;
    }
  }, [data, extra]);

  useEffect(() => {
    if (!props.observer || !["trending", "hot", "created"].includes(props.filter)) return;
    const queryClient = getQueryClient();
    const queryKey = [
      QueryIdentifiers.GET_POSTS_RANKED,
      props.filter,
      props.tag,
      20,
      props.observer ?? ""
    ];
    const interval = setInterval(async () => {
      const resp = await getPostsRanked(
        props.filter,
        "",
        "",
        MAX_PENDING,
        props.tag,
        props.observer
      );
      setNow(Date.now());
      if (!resp || resp.length === 0) return;

      // Update existing entries with latest stats
      queryClient.setQueryData<InfiniteData<Entry[] | SearchResponse>>(queryKey, (old) => {
        if (!old) return old;
        const map = new Map(resp.map((e) => [`${e.author}-${e.permlink}`, e]));
        return {
          ...old,
          pages: old.pages.map((page) => {
            if (Array.isArray(page)) {
              return (page as Entry[]).map((item) => {
                const updated = map.get(`${item.author}-${item.permlink}`);
                return updated ? { ...item, ...updated } : item;
              });
            }
            return page;
          })
        };
      });

      setExtra((p) =>
        p.map((item) => {
          const updated = resp.find(
            (e) => e.author === item.author && e.permlink === item.permlink
          );
          return updated ? { ...item, ...updated } : item;
        })
      );

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
    }, 30000);
    return () => clearInterval(interval);
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
          onClick={revealNew}
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
          <span>{pending.length} new {pending.length > 1 ? "posts" : "post"}</span>
        </div>
      )}
      <div className={`entry-list-body ${listStyle === ListStyle.grid ? "grid-view" : ""}`}>
        {isLoading && <LinearProgress />}
        {extra.length > 0 && (
          <EntryListContent
            username=""
            loading={false}
            entries={extra}
            sectionParam={props.filter}
            isPromoted={false}
            showEmptyPlaceholder={false}
            now={now}
          />
        )}
        {React.Children.map(props.children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<{ now?: number }>, { now })
            : child
        )}
      </div>
    </div>
  );
}

"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { FollowTagChipToggle, useFollowedTags } from "@/features/shared/follow-tag-btn";
import { makePathTag } from "@/features/shared/tag";
import { getAccessToken } from "@/utils";
import { getTrendingTagsQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UilMultiply } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { IntentLink } from "@/features/shared/intent-link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import "./_index.scss";

export function TrendingTagsCard() {
  const router = useRouter();
  const params = useParams<{ sections: string[] }>();
  let filter = "hot";
  let tag = "";

  if (params && params.sections) {
    [filter = "hot", tag = ""] = params.sections;
  }

  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const accessToken = useMemo(() => (username ? getAccessToken(username) : undefined), [username]);

  const {
    data: trendingTagsPages,
    isLoading,
    isError
  } = useInfiniteQuery(getTrendingTagsQueryOptions(250));
  // The user's followed tags come first, then the trending list without them,
  // so a followed topic is one click away and never listed twice.
  const { tags: favoriteTags } = useFollowedTags(username, accessToken);
  const pinnedTags = useMemo(() => favoriteTags?.map((f) => f.tag) ?? [], [favoriteTags]);
  const trendingTags = useMemo(() => {
    const first = trendingTagsPages?.pages[0];
    if (!first) {
      return pinnedTags;
    }
    const pinned = new Set(pinnedTags);
    return [...pinnedTags, ...first.filter((t) => !pinned.has(t))];
  }, [pinnedTags, trendingTagsPages?.pages]);

  const handleUnselection = useCallback(() => {
    router.push("/" + filter + ((activeUser && activeUser.username && "/my") || ""));
  }, [activeUser, filter, router]);

  // Keep the current topic reachable even when it falls outside the short list.
  const visibleTags = useMemo(() => {
    const selected = trendingTags?.includes(tag) ? tag : undefined;
    return [...new Set([...(selected ? [selected] : []), ...(trendingTags ?? [])])].slice(0, 6);
  }, [tag, trendingTags]);

  return (
    <div className="trending-tags-card feed-topics">
      <h2 className="feed-sidebar-heading">{i18next.t("trending-tags.title")}</h2>
      <ul className="feed-topic-list">
        {visibleTags.map((t) => (
          <li key={t} className="feed-topic-row">
            <IntentLink
              href={makePathTag("created", t)}
              aria-current={tag === t ? "page" : undefined}
            >
              <span aria-hidden="true">#</span>
              <span className="truncate">{t}</span>
            </IntentLink>
            {activeUser && <FollowTagChipToggle tag={t} />}
            {tag === t && (
              <button
                type="button"
                className="feed-topic-dismiss"
                aria-label={i18next.t("g.dismiss")}
                onClick={handleUnselection}
              >
                <UilMultiply className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
        {isLoading &&
          visibleTags.length === 0 &&
          Array.from({ length: 6 }, (_, i) => (
            <li
              key={i}
              className="h-8 w-28 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
              aria-hidden="true"
            />
          ))}
      </ul>
      {isError && visibleTags.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{i18next.t("g.server-error")}</p>
      )}
      <Link href="/tags" className="feed-sidebar-link">
        {i18next.t("trending-tags.explore")}
      </Link>
    </div>
  );
}

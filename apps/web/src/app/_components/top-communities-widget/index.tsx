"use client";

import { getCommunityCache } from "@/core/caches";
import { Community } from "@/entities";
import { UserAvatar } from "@/features/shared/user-avatar";
import { IntentLink } from "@/features/shared/intent-link";
import { SubscriptionBtn } from "@/app/communities/_components/subscription-btn";
import { formattedNumber, makePath } from "@/utils";
import { AllFilter } from "@/enums";
import { seededShuffle } from "@/utils/seeded-shuffle";
import { getCommunitiesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import Link from "next/link";
import { useMemo, useState } from "react";

const PINNED = "hive-125125";
const SLOTS = 3;
/** The ranked communities the two rotating slots draw from. */
const POOL_SIZE = 30;

export const TopCommunitiesWidget = () => {
  const { data: ecencyCommunity, isLoading: ecencyLoading } = useQuery(
    getCommunityCache(PINNED)
  );
  const { data, isLoading, isError } = useQuery(getCommunitiesQueryOptions("rank"));
  // One seed per mount: the pair changes on every page load, so more communities
  // get seen, but stays put while the reader scrolls and the queries refetch.
  const [seed] = useState(() => Math.random());

  const list = useMemo(() => {
    // Town Square is pinned first. The other slots rotate through the top of the
    // ranking instead of always showing the same two leaders. A failed Town
    // Square request must not hide the other suggestions, and the list is
    // deduplicated by community name.
    const communities = new Map<string, Community>();
    if (ecencyCommunity) communities.set(ecencyCommunity.name, ecencyCommunity);
    const pool = (data ?? []).filter((c) => c.name !== PINNED).slice(0, POOL_SIZE);
    for (const community of seededShuffle(pool, seed)) {
      if (communities.size === SLOTS) break;
      if (!communities.has(community.name)) communities.set(community.name, community);
    }
    return [...communities.values()];
  }, [ecencyCommunity, data, seed]);
  const loading = isLoading || ecencyLoading;

  return (
    <div className="feed-communities">
      <h2 className="feed-sidebar-heading">{i18next.t("top-communities.discover-title")}</h2>
      <div className="flex flex-col gap-6">
        {list.map((community) => (
          <div key={community.name} className="feed-community">
            <div className="feed-community-heading">
              <IntentLink
                href={makePath(AllFilter.hot, community.name)}
                className="feed-community-name"
              >
                <UserAvatar username={community.name} size="small" />
                <span>{community.title}</span>
              </IntentLink>
              <SubscriptionBtn community={community} buttonProps={{ size: "sm", outline: true }} />
            </div>
            <p className="feed-community-about">{community.about}</p>
            <div className="feed-community-members">
              {i18next.t("communities.n-subscribers", {
                n: formattedNumber(community.subscribers, { fractionDigits: 0 })
              })}
            </div>
          </div>
        ))}
        {list.length === 0 &&
          loading &&
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
              aria-hidden="true"
            />
          ))}
        {list.length === 0 && !loading && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t(isError ? "g.server-error" : "communities.no-results")}
          </p>
        )}
      </div>
      <Link href="/communities" className="feed-sidebar-link">
        {i18next.t("top-communities.explore")}
      </Link>
      <div className="feed-community-create">
        <Link href="/communities/create" className="feed-sidebar-link">
          {i18next.t("top-communities.create-button")}
        </Link>
      </div>
    </div>
  );
};

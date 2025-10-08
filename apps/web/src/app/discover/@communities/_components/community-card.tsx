import Link from "next/link";
import { UserAvatar } from "@/features/shared";
import { SubscriptionBtn } from "@/app/communities/_components";
import React from "react";
import { Community } from "@/entities";
import i18next from "i18next";
import { formattedNumber } from "@/utils";
import CommunityCardAnimated from "./community-card-animated-client";

interface Props {
  community: Community;
  i: number;
}

export function CommunityCard({ community, i }: Props) {
  return (
    <CommunityCardAnimated
      className="col-span-12 sm:col-span-6 lg:col-span-4 border border-[--border-color] bg-white dark:bg-dark-200 rounded-2xl p-4 flex flex-col justify-between gap-4"
      i={i}
    >
      <div className="uppercase text-xs font-semibold opacity-25">{i18next.t("g.community")}</div>
      <div className="flex items-start gap-2">
        <Link href={`/created/${community.name}`}>
          <UserAvatar username={community.name} size="large" />
        </Link>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">
            <Link className="line-clamp-1" href={`/created/${community.name}`}>
              {community.title}
            </Link>
          </h3>
          <p className="text-sm opacity-75 line-clamp-2 h-[40px]">{community.about}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 text-center text-sm opacity-75">
        <div>
          {i18next.t("communities.n-subscribers", {
            n: formattedNumber(community.subscribers, { fractionDigits: 0 })
          })}
        </div>
        <div>
          {i18next.t("communities.n-authors", {
            n: formattedNumber(community.num_authors, { fractionDigits: 0 })
          })}
        </div>
        <div>
          {i18next.t("communities.n-posts", {
            n: formattedNumber(community.num_pending, { fractionDigits: 0 })
          })}
        </div>
      </div>
      <SubscriptionBtn community={community} buttonProps={{ full: true }} />
    </CommunityCardAnimated>
  );
}

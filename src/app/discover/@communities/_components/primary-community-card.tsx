import Link from "next/link";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { SubscriptionBtn } from "@/app/communities/_components";
import React from "react";
import { Community } from "@/entities";
import i18next from "i18next";
import { formattedNumber } from "@/utils";
import { Badge } from "@ui/badge";
import CommunityCardAnimated from "./community-card-animated-client";

interface Props {
  community: Community;
}

export function PrimaryCommunityCard({ community }: Props) {
  return (
    <CommunityCardAnimated
      className="border border-[--border-color] bg-white dark:bg-dark-200 rounded-2xl p-4 h-full flex flex-col gap-4"
      i={0}
    >
      <div className="uppercase text-xs font-semibold opacity-25">{i18next.t("g.community")}</div>
      <Link href={`/created/${community.name}`} className="self-center">
        <UserAvatar username={community.name} size="large" />
      </Link>
      <div className="flex flex-col">
        <h3 className="text-center font-semibold text-xl">
          <Link href={`/created/${community.name}`}>{community.title}</Link>
        </h3>
        <p className="capitalize text-sm opacity-75 text-center">{community.about}</p>
      </div>
      <div className="flex justify-center">
        <SubscriptionBtn community={community} />
      </div>
      <div className="bg-[--border-color] h-[1px]" />
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
      <div className="bg-[--border-color] h-[1px]" />
      <div className="flex flex-col gap-2">
        <h4 className="text-sm opacity-75 font-semibold">{i18next.t("discover.team")}</h4>
        <div className="flex flex-wrap gap-2">
          {community.team
            .filter(([_, role]) => role === "admin")
            .map(([x, role], i) => (
              <ProfileLink key={x} username={x} className="hover:opacity-50">
                <Badge className="!py-1 !px-1 !pr-2 flex items-center gap-1.5">
                  <UserAvatar username={x} size="small" />
                  {x}
                </Badge>
              </ProfileLink>
            ))}
        </div>
      </div>
    </CommunityCardAnimated>
  );
}

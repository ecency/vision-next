"use client";

import { getAccountFullQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { AvailableCredits, UserAvatar } from "@/features/shared";
import Image from "next/image";
import i18next from "i18next";
import { Followers, Following } from "@/app/(dynamicPages)/profile/[username]/_components/friends";
import React, { useState } from "react";
import { WavesProfileCardLoading } from "@/app/waves/_components/waves-profile-card-loading";

export function WavesProfileCard() {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data, isLoading } = getAccountFullQuery(activeUser?.username).useClientQuery();

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  if (isLoading || !activeUser) {
    return <WavesProfileCardLoading />;
  }

  return (
    <div className="rounded-2xl overflow-hidden relative bg-white dark:bg-dark-200 p-4">
      <Image
        className="absolute top-0 left-0 w-full h-[156px]"
        src={data?.profile.cover_image ?? "/assets/promote-wave-bg.jpg"}
        alt=""
        width={300}
        height={200}
      />
      <div className="relative flex flex-col mt-[100px] gap-2">
        <UserAvatar username={activeUser?.username ?? ""} size="large" className="mb-2" />
        <div className="font-semibold">{data?.profile.name ?? data ? `@${data?.name}` : ""}</div>
        {data?.profile.about && <div className="line-clamp-2 text-sm">{data?.profile.about}</div>}
        <div className="grid grid-cols-2">
          <div
            className="hover:text-blue-dark-sky hover:scale-95 duration-300 cursor-pointer"
            onClick={() => setShowFollowers(true)}
          >
            <div className="text-sm opacity-50">{i18next.t("profile.followers")}</div>
            <div className="font-semibold">{data?.follow_stats?.follower_count ?? 0}</div>
          </div>
          <div
            className="hover:text-blue-dark-sky hover:scale-95 duration-300 cursor-pointer"
            onClick={() => setShowFollowing(true)}
          >
            <div className="text-sm opacity-50">{i18next.t("profile.following")}</div>
            <div className="font-semibold">{data?.follow_stats?.following_count ?? 0}</div>
          </div>
        </div>
        <AvailableCredits username={activeUser?.username ?? ""} operation="comment_operation" />
      </div>

      {showFollowers && data && <Followers account={data} onHide={() => setShowFollowers(false)} />}
      {showFollowing && data && <Following account={data} onHide={() => setShowFollowing(false)} />}
    </div>
  );
}

"use client";

import { useClientActiveUser } from "@/api/queries";
import { Followers, Following } from "@/app/(dynamicPages)/profile/[username]/_components/friends";
import { FollowControls, UserAvatar } from "@/features/shared";
import { useQuery } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { WavesProfileCardLoading } from "@/app/waves/_components/waves-profile-card-loading";
import Image from "next/image";
import Link from "next/link";
import i18next from "i18next";
import { Button } from "@ui/button";
import { useMemo, useState } from "react";

interface Props {
  username?: string;
}

export function WaveAuthorCard({ username }: Props) {
  const sanitizedUsername = useMemo(() => username?.replace(/^@/, "") ?? "", [username]);
  const activeUser = useClientActiveUser();

  const { data, isLoading } = useQuery(getAccountFullQueryOptions(sanitizedUsername));

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  if (!sanitizedUsername) {
    return null;
  }

  if (isLoading && !data) {
    return <WavesProfileCardLoading />;
  }

  const displayName = data?.profile?.name || `@${sanitizedUsername}`;
  const about = data?.profile?.about;
  const coverImage = data?.profile?.cover_image?.trim()
    ? data.profile.cover_image
    : "/assets/promote-wave-bg.jpg";

  const followerCount = data?.follow_stats?.follower_count ?? 0;
  const followingCount = data?.follow_stats?.following_count ?? 0;

  return (
    <div className="rounded-2xl overflow-hidden relative bg-white dark:bg-dark-200 p-4">
      <Image
        className="absolute top-0 left-0 w-full h-[156px] object-cover"
        src={coverImage}
        alt=""
        width={300}
        height={200}
      />
      <div className="relative flex flex-col mt-[100px] gap-2">
        <UserAvatar username={sanitizedUsername} size="large" className="mb-2" />
        <div className="font-semibold">{displayName}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">@{sanitizedUsername}</div>
        {about && <div className="line-clamp-2 text-sm">{about}</div>}
        <div className="grid grid-cols-2">
          <button
            type="button"
            className="text-left hover:text-blue-dark-sky hover:scale-95 duration-300 cursor-pointer"
            onClick={() => data && setShowFollowers(true)}
            disabled={!data}
          >
            <div className="text-sm opacity-50">{i18next.t("profile.followers")}</div>
            <div className="font-semibold">{followerCount}</div>
          </button>
          <button
            type="button"
            className="text-left hover:text-blue-dark-sky hover:scale-95 duration-300 cursor-pointer"
            onClick={() => data && setShowFollowing(true)}
            disabled={!data}
          >
            <div className="text-sm opacity-50">{i18next.t("profile.following")}</div>
            <div className="font-semibold">{followingCount}</div>
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {activeUser?.username !== sanitizedUsername && (
            <FollowControls targetUsername={sanitizedUsername} showMute={false} />
          )}
          <Link href={`/@${sanitizedUsername}`}>
            <Button appearance="white" outline={true} size="sm">
              {i18next.t("g.view-profile", { defaultValue: "View profile" })}
            </Button>
          </Link>
        </div>
      </div>

      {showFollowers && data && (
        <Followers account={data} onHide={() => setShowFollowers(false)} />
      )}
      {showFollowing && data && (
        <Following account={data} onHide={() => setShowFollowing(false)} />
      )}
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RCAccount } from "@hiveio/dhive/lib/chain/rc";
import defaults from "@/defaults.json";
import "./_index.scss";
import { Button } from "@ui/button";
import { Account, FullAccount, Subscription } from "@/entities";
import Link from "next/link";
import i18next from "i18next";
import { JoinCommunityChatBtn } from "@/app/chats/_components/join-community-chat-btn";
import { accountReputation, dateToFormatted, formattedNumber, isCommunity } from "@/utils";
import { calendarRangeSvg, earthSvg, nearMeSvg, rssSvg } from "@ui/svg";
import { Tooltip } from "@ui/tooltip";
import { ResourceCreditsInfo } from "../rc-info";
import { Skeleton, UserAvatar } from "@/features/shared";
import { findRcAccounts, rcPower } from "@/api/hive";
import { getRelationshipBetweenAccounts, getSubscriptions } from "@/api/bridge";
import { useGlobalStore } from "@/core/global-store";
import { getCommunityCache } from "@/core/caches";
import { CommunityCardEditPic } from "@/app/(dynamicPages)/community/[community]/_components/community-card/community-card-edit-pic";
import { Followers, Following } from "../friends";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  getAccountFullQuery,
  getRcAccountsQuery,
  useGetRelationshipBtwAccounts,
  useGetSubscriptionsQuery
} from "@/api/queries";
import { WavesProfileCardLoading } from "@/app/waves/_components";
import { ProfileCardExtraProperty } from "./profile-card-extra-property";
import {
  UilCalendarAlt,
  UilGlobe,
  UilLocationPinAlt,
  UilLocationPoint,
  UilRss
} from "@tooni/iconscout-unicons-react";
import { Badge } from "@/features/ui";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  account: Account;
}

export const ProfileCard = ({ account }: Props) => {
  // const activeUser = useGlobalStore((s) => s.activeUser);

  // const [followersList, setFollowersList] = useState(false);
  // const [followingList, setFollowingList] = useState(false);
  // const [followsActiveUser, setFollowsActiveUser] = useState(false);
  // const [followsActiveUserLoading, setFollowsActiveUserLoading] = useState(false);
  // const [subs, setSubs] = useState([] as Subscription[]);
  // const [rcPercent, setRcPercent] = useState(100);

  // const pathname = usePathname();
  // const [, updateState] = useState();
  // const forceUpdate = useCallback(() => updateState({} as any), []);

  // const { data: community } = getCommunityCache(account?.name).useClientQuery();

  // const getFollowsInfo = useCallback(
  //   (username: string) => {
  //     if (activeUser) {
  //       getRelationshipBetweenAccounts(username, activeUser.username)
  //         .then((res) => {
  //           setFollowsActiveUserLoading(false);
  //           setFollowsActiveUser(res?.follows || false);
  //         })
  //         .catch((error) => {
  //           setFollowsActiveUserLoading(false);
  //           setFollowsActiveUser(false);
  //         });
  //     }
  //   },
  //   [activeUser]
  // );

  // const toggleFollowers = () => {
  //   setFollowersList(!followersList);
  // };

  // const toggleFollowing = () => {
  //   setFollowingList(!followingList);
  // };
  // const loggedIn = activeUser && activeUser.username;

  // useEffect(() => {
  //   setFollowersList(false);
  //   setFollowingList(false);
  //   setFollowsActiveUserLoading(!!(activeUser && activeUser.username));
  //   getFollowsInfo(account?.name);
  // }, [account?.name, activeUser, getFollowsInfo]);

  // useEffect(() => {
  //   if (activeUser && activeUser.username) {
  //     setFollowsActiveUserLoading(!!(activeUser && activeUser.username));
  //     getFollowsInfo(account?.name);
  //   }
  //   getSubscriptions(account?.name)
  //     .then((r) => {
  //       if (r) {
  //         const communities = r.filter((x) => x[2] === "mod" || x[2] === "admin");
  //         setSubs(communities);
  //       }
  //     })
  //     .catch((e) => {
  //       setSubs([]);
  //     });
  //   findRcAccounts(account?.name)
  //     .then((r: RCAccount[]) => {
  //       if (r && r[0]) {
  //         setRcPercent(rcPower(r[0]));
  //       }
  //     })
  //     .catch((e) => {
  //       setRcPercent(100);
  //     });
  // }, [account, activeUser, getFollowsInfo]);

  // // TODO: use better conditions throughout app than .__loaded, remove all instances that rely on .__loaded
  // if (!account?.__loaded) {
  //   return (
  //     <div className="profile-card">
  //       <div className="profile-avatar">
  //         <UserAvatar username={account?.name} size="xLarge" />
  //       </div>

  //       <h1>
  //         <div className="username">{account?.name}</div>
  //       </h1>
  //     </div>
  //   );
  // }

  // const isSettings = pathname.includes("settings");

  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data } = getAccountFullQuery(account.name).useClientQuery();
  const { data: rcData } = getRcAccountsQuery(account.name).useClientQuery();
  const { data: relationshipBetweenAccounts } = useGetRelationshipBtwAccounts(
    account?.name,
    activeUser?.username
  );
  const { data: subscriptions } = useGetSubscriptionsQuery(account?.name);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>();

  const isMyProfile = useMemo(
    () =>
      activeUser &&
      activeUser.username === account?.name &&
      activeUser.data.__loaded &&
      activeUser.data.profile,
    [account?.name, activeUser]
  );
  const moderatedCommunities = useMemo(
    () => subscriptions?.filter((x) => x[2] === "mod" || x[2] === "admin") ?? [],
    [subscriptions]
  );

  return (
    <div className="rounded-2xl overflow-hidden relative bg-white dark:bg-dark-200 p-4">
      <Image
        className="absolute top-0 left-0 w-full h-[156px] object-cover"
        src={imageSrc ?? data?.profile.cover_image ?? ""}
        onError={() => setImageSrc("/assets/promote-wave-bg.jpg")}
        alt=""
        width={300}
        height={200}
      />

      <AnimatePresence>
        {!isMyProfile && relationshipBetweenAccounts?.follows && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Badge className="relative z-10">{i18next.t("profile.follows-you")}</Badge>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col mt-[100px] gap-2">
        <UserAvatar username={account?.name ?? ""} size="large" className="mb-2" />
        <div className="font-semibold">{data?.profile.name ?? data ? `@${data?.name}` : ""}</div>
        {data?.profile.about && <div className="line-clamp-2 text-sm">{data?.profile.about}</div>}
        <div className="grid grid-cols-2 pb-4">
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
      </div>

      {showFollowers && data && <Followers account={data} onHide={() => setShowFollowers(false)} />}
      {showFollowing && data && <Following account={data} onHide={() => setShowFollowing(false)} />}

      {data && (
        <div className="-mx-4 border-y border-[--border-color] px-4 py-4">
          <ResourceCreditsInfo rcPercent={rcData ? rcPower(rcData[0]) : 100} account={data} />
        </div>
      )}
      <div className="flex flex-col w-full gap-4 py-4">
        {data?.profile?.location && (
          <ProfileCardExtraProperty
            icon={<UilLocationPoint className="w-5 h-5" />}
            label={i18next.t("profile-edit.location")}
          >
            {data.profile.location}
          </ProfileCardExtraProperty>
        )}

        {data?.profile?.website && (
          <ProfileCardExtraProperty
            icon={<UilGlobe className="w-5 h-5" />}
            label={i18next.t("profile-edit.website")}
          >
            <Link
              target="_external"
              href={`https://${data?.profile.website.replace(/^(https?|ftp):\/\//, "")}`}
            >
              {data?.profile.website}
            </Link>
          </ProfileCardExtraProperty>
        )}

        {data?.created && (
          <ProfileCardExtraProperty
            icon={<UilCalendarAlt className="w-5 h-5" />}
            label={i18next.t("referral.created")}
          >
            {dateToFormatted(data?.created, "LL")}
          </ProfileCardExtraProperty>
        )}

        <ProfileCardExtraProperty icon={<UilRss className="w-5 h-5" />} label="RSS Feed">
          <Link href={`${defaults.base}/@${account?.name}/rss`}>
            {i18next.t("profile-info.subscribe")}
          </Link>
        </ProfileCardExtraProperty>
      </div>

      {moderatedCommunities.length > 0 && (
        <div className="-mx-4 p-4 flex flex-col gap-2 border-t border-[--border-color]">
          <div className="text-sm opacity-50">{i18next.t("profile.com-mod")}</div>
          {moderatedCommunities.map((x) => (
            <Link className="flex items-center gap-2 text-sm" key={x[0]} href={`/created/${x[0]}`}>
              <UserAvatar username={x[0]} size="small" />
              {x[1]}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

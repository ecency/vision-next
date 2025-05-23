"use client";

import { rcPower } from "@/api/hive";
import {
  getAccountFullQuery,
  useGetRelationshipBtwAccounts,
  useGetSubscriptionsQuery
} from "@/api/queries";
import { EcencyConfigManager } from "@/config";
import { useGlobalStore } from "@/core/global-store";
import defaults from "@/defaults.json";
import { Account } from "@/entities";
import { FollowControls, UserAvatar } from "@/features/shared";
import { FavouriteBtn } from "@/features/shared/favorite-btn";
import { Badge } from "@/features/ui";
import { accountReputation, dateToFormatted } from "@/utils";
import { UilCalendarAlt, UilGlobe, UilLocationPoint, UilRss } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Followers, Following } from "../friends";
import { ProfileInfo } from "../profile-info";
import { ResourceCreditsInfo } from "../rc-info";
import "./_index.scss";
import { ProfileCardExtraProperty } from "./profile-card-extra-property";
import { useQuery } from "@tanstack/react-query";
import { getAccountRcQueryOptions } from "@ecency/sdk";

interface Props {
  account: Account;
}

export const ProfileCard = ({ account }: Props) => {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data } = getAccountFullQuery(account.name).useClientQuery();
  const { data: rcData } = useQuery(getAccountRcQueryOptions(account.name));
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
    <div className="rounded-xl w-full overflow-hidden relative p-4">
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
        <div className="absolute z-10 right-4 top-4">
          <ProfileInfo account={account} />
        </div>
      </AnimatePresence>

      <div className="relative flex flex-col mt-[100px] gap-2">
        <UserAvatar username={account?.name ?? ""} size="large" />

        <div className="font-semibold flex items-center flex-wrap gap-2">
          {data?.profile.name ?? data ? `@${data?.name}` : ""}
          <Badge>{accountReputation(data?.reputation ?? 0)}</Badge>
        </div>
        {data?.profile.about && <div className="text-sm">{data?.profile.about}</div>}
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

      <div className="mb-4 flex gap-2">
        <FollowControls targetUsername={account?.name} />
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.favourites.enabled}
        >
          <FavouriteBtn targetUsername={account?.name} />
        </EcencyConfigManager.Conditional>
      </div>

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
          <Link target="_external" href={`${defaults.base}/@${account?.name}/rss`}>
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

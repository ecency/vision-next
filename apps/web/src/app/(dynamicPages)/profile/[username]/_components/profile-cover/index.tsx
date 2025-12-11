"use client";

import React, {useMemo} from "react";
import defaults from "@/defaults";
import {proxifyImageSrc, setProxyBase} from "@ecency/render-helper";
import "./_index.scss";
import {Account} from "@/entities";
import {FollowControls} from "@/features/shared";
import {useGlobalStore} from "@/core/global-store";
import {FavouriteBtn} from "@/features/shared/favorite-btn";
import {ProfileInfo} from "@/app/(dynamicPages)/profile/[username]/_components/profile-info";
import {EcencyConfigManager} from "@/config";
import {ProfileFilter, Theme} from "@/enums";
import {usePathname} from "next/navigation";
import {useClientTheme} from "@/api/queries";

setProxyBase(defaults.imageServer);

interface Props {
  account: Account;
}

export function ProfileCover({ account }: Props) {
  const [theme] = useClientTheme();

  const canUseWebp = useGlobalStore((state) => state.canUseWebp);
  const activeUser = useGlobalStore((state) => state.activeUser);

  const pathname = usePathname();
  const section = useMemo(() => pathname?.split("/")[2] ?? "posts", [pathname]);

  const coverFallbackDay = "/assets/cover-fallback-day.png";
  const coverFallbackNight = "/assets/cover-fallback-night.png";
  let bgImage = "";

  if (account) {
    bgImage = theme === Theme.day ? coverFallbackDay : coverFallbackNight;
    if (account.profile?.cover_image) {
      bgImage = proxifyImageSrc(account.profile.cover_image, 0, 0, canUseWebp ? "webp" : "match");
    }
  }

  let style = {};
  if (bgImage) {
    style = { backgroundImage: `url('${bgImage}')` };
  }

  const hideControls = activeUser && activeUser.username === account?.name;

  return [...Object.keys(ProfileFilter), "communities"].includes(section) ? (
    <div className="profile-cover rounded-2xl overflow-hidden">
      <div className="cover-image" style={style} />
      <div className="relative flex items-center justify-end w-full gap-2 p-4">
        <ProfileInfo account={account} />
        {!hideControls && (
          <>
            <FollowControls targetUsername={account?.name} />
            <EcencyConfigManager.Conditional
              condition={({ visionFeatures }) => visionFeatures.favourites.enabled}
            >
              <FavouriteBtn targetUsername={account?.name} />
            </EcencyConfigManager.Conditional>
          </>
        )}
      </div>
    </div>
  ) : (
    <></>
  );
}

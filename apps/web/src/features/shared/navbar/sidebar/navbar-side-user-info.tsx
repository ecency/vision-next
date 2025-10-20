import React, { useMemo } from "react";
import { useGlobalStore } from "@/core/global-store";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { chevronUpSvg } from "@ui/svg";
import { downVotingPower, votingPower } from "@/api/hive";
import { FullAccount } from "@/entities";
import i18next from "i18next";

export function NavbarSideUserInfo() {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const { upPower, downPower } = useMemo(() => {
    const account = activeUser?.data as FullAccount | undefined;

    if (!account?.__loaded) {
      return { upPower: null, downPower: null };
    }

    const voting = votingPower(account);
    const downVoting = downVotingPower(account);

    return {
      upPower: voting,
      downPower: downVoting
    };
  }, [activeUser?.data]);

  return (
    <div className="flex items-center gap-3 max-w-[16rem] truncate">
      <ProfileLink username={activeUser!.username}>
        <UserAvatar username={activeUser!.username} size="medium" />
      </ProfileLink>
      <div>
        <div className="font-semibold">{activeUser?.username}</div>
        <div className="flex flex-col text-xs">
          <div className="flex items-center">
            <div className="[&>svg]:w-4 text-blue-dark-sky">
              {chevronUpSvg}
              {upPower === null ? "--" : upPower.toFixed(2)}%
            </div>
            <div className="[&>svg]:w-4 [&>svg]:rotate-180 text-red">
              {chevronUpSvg}
              {downPower === null ? "--" : downPower.toFixed(2)}%
            </div>
          </div>
          <div className="opacity-50">{i18next.t("user-nav.vote-power")}</div>
        </div>
      </div>
    </div>
  );
}

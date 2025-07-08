import React, { useMemo } from "react";
import { useGlobalStore } from "@/core/global-store";
import { UserAvatar } from "@/features/shared";
import { CommunityTypes } from "@/enums";
import i18next from "i18next";
import { Button } from "@/features/ui";
import { Community } from "@/entities";

interface Props {
  name: string | null;
  title: string;
  community?: Community;
  onSelect: (value: string | null) => void;
  onHide: () => void;
}

const COMMUNITY_TYPES = {
  [CommunityTypes.Topic]: i18next.t("communities.types.topic"),
  [CommunityTypes.Journal]: i18next.t("communities.types.journal"),
  [CommunityTypes.Council]: i18next.t("communities.types.council")
};

export function CommunitySelectorItem({ name, title, onSelect, onHide, community }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const communityType = useMemo(() => {
    if (name?.startsWith("hive-3")) {
      return CommunityTypes.Council;
    }

    if (name?.startsWith("hive-2")) {
      return CommunityTypes.Journal;
    }

    return CommunityTypes.Topic;
  }, [name]);
  const canPost = useMemo(() => {
    switch (communityType) {
      case CommunityTypes.Journal:
      case CommunityTypes.Council:
        return (
          activeUser &&
          (community?.admins?.includes(activeUser.username) || activeUser.username === name)
        );

      case CommunityTypes.Topic:
      default:
        return true;
    }
  }, [communityType, community, activeUser, name]);

  return (
    <Button
      appearance="gray"
      disabled={!canPost}
      onClick={() => {
        if (canPost) {
          onSelect(name);
          onHide();
        }
      }}
      icon={<UserAvatar username={name ?? activeUser?.username ?? ""} size="small" />}
      iconPlacement="left"
    >
      <div className="text-left flex flex-col">
        <span className="text-xs font-semibold notranslate">{title}</span>
        <span className="text-gray-600 font-semibold text-[9px] uppercase dark:text-gray-400">
          {COMMUNITY_TYPES[communityType]}
        </span>
      </div>
    </Button>
  );
}

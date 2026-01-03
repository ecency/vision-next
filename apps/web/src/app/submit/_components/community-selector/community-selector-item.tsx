import React, { useMemo } from "react";
import { UserAvatar } from "@/features/shared";
import { CommunityTypes } from "@/enums";
import i18next from "i18next";
import { Button } from "@/features/ui";
import { Community } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import {
  getCommunityContextQueryOptions,
  getCommunityPermissions,
  getCommunityType
} from "@ecency/sdk";

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
  const { activeUser } = useActiveAccount();

  const { data: userContext } = useQuery({
    ...getCommunityContextQueryOptions(activeUser?.username, name ?? undefined),
    select: ({ subscribed, role }) =>
      getCommunityPermissions({
        communityType: getCommunityType(name ?? "", -1),
        subscribed,
        userRole: role
      })
  });

  const communityType = useMemo(() => getCommunityType(name ?? "", -1), [name]);

  return (
    <Button
      appearance="gray"
      disabled={!userContext?.canPost && !!name}
      onClick={() => {
        if (userContext?.canPost || !name) {
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

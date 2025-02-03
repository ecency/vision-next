"use client";

import React, { useCallback, useMemo } from "react";
import { Button } from "@ui/button";
import { useGetRelationshipBtwAccounts } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { useFollow, useIgnore } from "@/api/mutations";
import i18next from "i18next";
import { LoginRequired } from "@/features/shared";
import { UilBell, UilBellSlash } from "@tooni/iconscout-unicons-react";
import { StyledTooltip } from "@ui/tooltip";

interface Props {
  targetUsername: string;
  where?: string;
}

interface ButtonProps {
  disabled: boolean;
  following: string;
}

function MuteButton({ disabled, following }: ButtonProps) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const { data } = useGetRelationshipBtwAccounts(activeUser?.username, following);
  const { mutateAsync: ignore, isPending } = useIgnore(activeUser?.username, following);

  return activeUser?.username !== following ? (
    <LoginRequired>
      <StyledTooltip
        content={
          data?.ignores === true ? i18next.t("entry-menu.unmute") : i18next.t("entry-menu.mute")
        }
      >
        <Button
          isLoading={isPending}
          size="sm"
          noPadding={true}
          className="w-[32px] mr-1"
          disabled={disabled}
          onClick={() => ignore()}
          appearance={data?.ignores === true ? "secondary" : "primary"}
          icon={data?.ignores === true ? <UilBell /> : <UilBellSlash />}
        />
      </StyledTooltip>
    </LoginRequired>
  ) : (
    <></>
  );
}

function FollowButton({ disabled, following }: ButtonProps) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const { mutateAsync: followApiRequest } = useFollow(activeUser!.username, following);
  const follow = useCallback(() => followApiRequest({ isFollow: true }), [followApiRequest]);

  return activeUser?.username !== following ? (
    <LoginRequired>
      <Button size="sm" style={{ marginRight: "5px" }} disabled={disabled} onClick={follow}>
        {i18next.t("follow-controls.follow")}
      </Button>
    </LoginRequired>
  ) : (
    <></>
  );
}

function UnFollowButton({ disabled, following }: ButtonProps) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const { mutateAsync: followApiRequest, isPending } = useFollow(activeUser!.username, following);
  const unFollow = useCallback(() => followApiRequest({ isFollow: false }), [followApiRequest]);

  return (
    <LoginRequired>
      <Button size="sm" style={{ marginRight: "5px" }} disabled={disabled} onClick={unFollow}>
        {i18next.t("follow-controls.unFollow")}
      </Button>
    </LoginRequired>
  );
}

export function FollowControls({ where, targetUsername }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const { data, isPending } = useGetRelationshipBtwAccounts(activeUser?.username, targetUsername);

  const showFollow = useMemo(
    () => data?.follows === false && !isPending,
    [data?.follows, isPending]
  );
  const showUnFollow = useMemo(
    () => data?.follows === true && !isPending,
    [data?.follows, isPending]
  );
  const showMute = useMemo(() => !isPending && where !== "chat-box", [isPending, where]);

  return (
    <>
      {showUnFollow && <UnFollowButton disabled={isPending} following={targetUsername} />}
      {showFollow && <FollowButton disabled={isPending} following={targetUsername} />}
      {showMute && <MuteButton disabled={isPending} following={targetUsername} />}
    </>
  );
}

"use client";

import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, LoginRequired, success } from "@/features/shared";
import { getRelationshipBetweenAccountsQueryOptions, useAccountRelationsUpdate } from "@ecency/sdk";
import { getSdkAuthContext } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { UilBell, UilBellSlash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { StyledTooltip } from "@ui/tooltip";
import i18next from "i18next";

interface Props {
  targetUsername: string;
  where?: string;
  showMute?: boolean;
}

interface ButtonProps {
  disabled: boolean;
  following: string;
}

function MuteButton({ disabled, following }: ButtonProps) {
  const { activeUser } = useActiveAccount();

  const { data } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, following)
  );
  const { mutateAsync: updateRelation, isPending } = useAccountRelationsUpdate(
    activeUser?.username,
    following,
    getSdkAuthContext(activeUser, activeUser?.username),
    (data) =>
      success(
        data?.ignores === true
          ? i18next.t("events.muted")
          : i18next.t("events.unmuted")
      ),
    (err) => error(...formatError(err))
  );

  return activeUser?.username !== following ? (
    <LoginRequired>
      <StyledTooltip
        content={
          data?.ignores === true ? i18next.t("entry-menu.unmute") : i18next.t("entry-menu.mute")
        }
      >
        <Button
          outline={true}
          isLoading={isPending}
          size="sm"
          noPadding={true}
          className="w-[32px] mr-1"
          disabled={disabled}
          onClick={() => updateRelation("toggle-ignore")}
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
  const { activeUser } = useActiveAccount();

  const { data } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, following)
  );

  const { mutateAsync: updateRelation, isPending } = useAccountRelationsUpdate(
    activeUser?.username,
    following,
    getSdkAuthContext(activeUser, activeUser?.username),
    (data) => {},
    (err) => error(...formatError(err))
  );

  return (
    <LoginRequired>
      <Button
        size="sm"
        style={{ marginRight: "5px" }}
        disabled={disabled}
        onClick={() => updateRelation("toggle-follow")}
      >
        {data?.follows
          ? i18next.t("follow-controls.unFollow")
          : i18next.t("follow-controls.follow")}
      </Button>
    </LoginRequired>
  );
}

export function FollowControls({ targetUsername, showMute = true }: Props) {
  const { activeUser } = useActiveAccount();

  const { isPending } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, targetUsername)
  );

  return (
    <>
      <FollowButton disabled={isPending} following={targetUsername} />
      {showMute && <MuteButton disabled={isPending} following={targetUsername} />}
    </>
  );
}

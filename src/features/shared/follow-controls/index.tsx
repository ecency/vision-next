"use client";

import { formatError } from "@/api/operations";
import { useGlobalStore } from "@/core/global-store";
import { error, LoginRequired, success } from "@/features/shared";
import { getRelationshipBetweenAccountsQueryOptions, useAccountRelationsUpdate } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilBell, UilBellSlash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { StyledTooltip } from "@ui/tooltip";
import i18next from "i18next";

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

  const { data } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, following)
  );
  const { mutateAsync: updateRelation, isPending } = useAccountRelationsUpdate(
    activeUser?.username,
    following,
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
  const activeUser = useGlobalStore((state) => state.activeUser);

  const { data } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, following)
  );

  const { mutateAsync: updateRelation, isPending } = useAccountRelationsUpdate(
    activeUser?.username,
    following,
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

export function FollowControls({ targetUsername }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const { isPending } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, targetUsername)
  );

  return (
    <>
      <FollowButton disabled={isPending} following={targetUsername} />
      <MuteButton disabled={isPending} following={targetUsername} />
    </>
  );
}

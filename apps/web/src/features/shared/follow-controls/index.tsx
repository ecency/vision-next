"use client";

import { formatError } from "@/api/format-error";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, LoginRequired, success } from "@/features/shared";
import { getRelationshipBetweenAccountsQueryOptions, useAccountRelationsUpdate } from "@ecency/sdk";
import { getSdkAuthContext } from "@/utils";
import { getUser } from "@/utils/user-token";
import { scheduleQuestsRefresh } from "@/utils/refresh-quests";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useRef } from "react";

interface Props {
  targetUsername: string;
  where?: string;
  showMute?: boolean;
}

interface ButtonProps {
  disabled: boolean;
  following: string;
}

// Ref guard: animate the label only when the relation value CHANGES after mount.
// The initial render (including the undefined -> loaded transition) must never animate.
function useRelationPop(relation: boolean | undefined) {
  const prev = useRef(relation);
  const changed = useRef(false);
  if (prev.current !== relation) {
    if (prev.current !== undefined) {
      changed.current = true;
    }
    prev.current = relation;
  }
  return changed.current;
}

function MuteButton({ disabled, following }: ButtonProps) {
  const { activeUser } = useActiveAccount();

  const { data } = useQuery(
    getRelationshipBetweenAccountsQueryOptions(activeUser?.username, following)
  );
  const { mutateAsync: updateRelation, isPending } = useAccountRelationsUpdate(
    activeUser?.username,
    following,
    getSdkAuthContext(getUser(activeUser?.username ?? "")),
    (data) =>
      success(
        data?.ignores === true
          ? i18next.t("events.muted")
          : i18next.t("events.unmuted")
      ),
    (err) => error(...formatError(err))
  );

  const ignores = data === undefined ? undefined : data.ignores === true;
  const shouldPop = useRelationPop(ignores);

  return activeUser?.username !== following ? (
    <LoginRequired>
      <Button
        outline={true}
        isLoading={isPending}
        size="sm"
        className="mr-1"
        disabled={disabled}
        onClick={() => updateRelation("toggle-ignore")}
        appearance={data?.ignores === true ? "secondary" : "primary"}
      >
        <span
          key={String(ignores)}
          className={shouldPop ? "inline-block animate-pop-in" : undefined}
        >
          {data?.ignores === true
            ? i18next.t("entry-menu.unmute")
            : i18next.t("entry-menu.mute")}
        </span>
      </Button>
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

  const queryClient = useQueryClient();
  const { mutateAsync: updateRelation, isPending } = useAccountRelationsUpdate(
    activeUser?.username,
    following,
    getSdkAuthContext(getUser(activeUser?.username ?? "")),
    () => scheduleQuestsRefresh(queryClient, activeUser?.username),
    (err) => error(...formatError(err))
  );

  const follows = data === undefined ? undefined : data.follows === true;
  const shouldPop = useRelationPop(follows);

  return (
    <LoginRequired promptOnAnon>
      <Button
        size="sm"
        style={{ marginRight: "5px" }}
        disabled={disabled}
        isLoading={isPending}
        onClick={() => updateRelation("toggle-follow")}
      >
        <span
          key={String(follows)}
          className={shouldPop ? "inline-block animate-pop-in" : undefined}
        >
          {data?.follows
            ? i18next.t("follow-controls.unFollow")
            : i18next.t("follow-controls.follow")}
        </span>
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

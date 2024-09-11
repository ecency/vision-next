"use client";

import React, { useMemo, useState } from "react";
import { Spinner } from "@ui/spinner";
import { Button, ButtonProps } from "@ui/button";
import { Community } from "@/entities";
import i18next from "i18next";
import { LoginRequired } from "@/features/shared";
import { useGetSubscriptionsQuery } from "@/api/queries";
import { useSubscribeToCommunity } from "@/api/mutations";
import { useGlobalStore } from "@/core/global-store";

interface Props {
  community: Community;
  buttonProps?: ButtonProps;
}
export function SubscriptionBtn({ buttonProps, community }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const [hover, setHover] = useState(false);

  const { data: subscriptions } = useGetSubscriptionsQuery(activeUser?.username);
  const { mutateAsync: subscribe, isPending } = useSubscribeToCommunity(community);

  const subscribed = useMemo(
    () => subscriptions?.find((x) => x[0] === community.name) !== undefined,
    [subscriptions, community]
  );

  return (
    <>
      {subscribed && (
        <Button
          icon={isPending && <Spinner className="w-3.5 h-3.5" />}
          disabled={isPending}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => subscribe({ isSubscribe: false })}
          outline={true}
          appearance={hover ? "danger" : "primary"}
          {...buttonProps}
        >
          {hover ? i18next.t("community.unsubscribe") : i18next.t("community.subscribed")}
        </Button>
      )}
      {!isPending && !subscribed && (
        <LoginRequired>
          <Button onClick={() => subscribe({ isSubscribe: true })} {...buttonProps}>
            {i18next.t("community.subscribe")}
          </Button>
        </LoginRequired>
      )}
    </>
  );
}

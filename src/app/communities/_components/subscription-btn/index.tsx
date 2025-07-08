"use client";

import { useSubscribeToCommunity } from "@/api/mutations";
import { useGlobalStore } from "@/core/global-store";
import { Community } from "@/entities";
import { LoginRequired } from "@/features/shared";
import { getAccountSubscriptionsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { Button, ButtonProps } from "@ui/button";
import { Spinner } from "@ui/spinner";
import i18next from "i18next";
import { useMemo, useState } from "react";

interface Props {
  community: Community;
  buttonProps?: ButtonProps;
}
export function SubscriptionBtn({ buttonProps, community }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const [hover, setHover] = useState(false);

  const { data: subscriptions } = useQuery(
    getAccountSubscriptionsQueryOptions(activeUser?.username)
  );
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

"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { Community } from "@/entities";
import { LoginRequired } from "@/features/shared";
import {
  useSubscribeCommunityMutation,
  useUnsubscribeCommunityMutation
} from "@/api/sdk-mutations";
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
  const { activeUser } = useActiveAccount();
  const [hover, setHover] = useState(false);

  const { data: subscriptions } = useQuery(
    getAccountSubscriptionsQueryOptions(activeUser?.username)
  );
  const subscribeMutation = useSubscribeCommunityMutation();
  const unsubscribeMutation = useUnsubscribeCommunityMutation();
  const isPending = subscribeMutation.isPending || unsubscribeMutation.isPending;

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
          onClick={() => unsubscribeMutation.mutateAsync({ community: community.name })}
          outline={true}
          appearance={hover ? "danger" : "primary"}
          {...buttonProps}
        >
          {hover ? i18next.t("community.unsubscribe") : i18next.t("community.subscribed")}
        </Button>
      )}
      {!subscribed && (
        <LoginRequired>
          <Button
            icon={isPending && <Spinner className="w-3.5 h-3.5" />}
            disabled={isPending}
            onClick={() => subscribeMutation.mutateAsync({ community: community.name })}
            {...buttonProps}
          >
            {i18next.t("community.subscribe")}
          </Button>
        </LoginRequired>
      )}
    </>
  );
}

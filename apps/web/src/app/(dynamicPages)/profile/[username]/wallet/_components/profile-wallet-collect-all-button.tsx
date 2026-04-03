"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountFullQueryOptions, useClaimPoints, getPointsQueryOptions } from "@ecency/sdk";
import { useClaimRewardsMutation } from "@/api/sdk-mutations";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useCallback, useMemo, useState } from "react";
import { getAccessToken } from "@/utils";
import { formatError } from "@/api/format-error";
import { HiveWallet } from "@/utils";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { useParams } from "next/navigation";

export function ProfileWalletCollectAllButton() {
  const { username: rawUsername } = useParams();
  const username = (rawUsername as string).replace("%40", "");
  const { activeUser } = useActiveAccount();
  const isOwnProfile = activeUser?.username === username;
  const [isCollecting, setIsCollecting] = useState(false);

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(username),
    enabled: Boolean(username),
  });
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const { data: pointsData } = useQuery({
    ...getPointsQueryOptions(username),
    enabled: Boolean(username),
  });

  const hasUnclaimedRewards = useMemo(() => {
    if (!accountData) return false;
    return new HiveWallet(accountData, dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hasUnclaimedRewards;
  }, [accountData, dynamicProps]);

  const hasPendingPoints = useMemo(() => {
    if (!pointsData?.uPoints) return false;
    const parsed = Number.parseFloat(pointsData.uPoints);
    return Number.isFinite(parsed) && parsed > 0;
  }, [pointsData?.uPoints]);

  const hasAnythingToCollect = hasUnclaimedRewards || hasPendingPoints;

  const { mutateAsync: claimRewards } = useClaimRewardsMutation();
  const { mutateAsync: claimPoints } = useClaimPoints(
    activeUser?.username,
    getAccessToken(activeUser?.username ?? "")
  );

  const handleCollectAll = useCallback(async () => {
    if (!isOwnProfile) return;

    setIsCollecting(true);
    const results: string[] = [];

    try {
      if (hasUnclaimedRewards && accountData) {
        await claimRewards({
          rewardHive: accountData.reward_hive_balance,
          rewardHbd: accountData.reward_hbd_balance,
          rewardVests: accountData.reward_vesting_balance,
        });
        results.push(i18next.t("wallet.claim-reward-balance-ok"));
      }

      if (hasPendingPoints) {
        await claimPoints({});
        results.push(i18next.t("points.claim-ok"));
      }

      if (results.length > 0) {
        success(results.join(" "));
      }
    } catch (e) {
      error(...formatError(e));
    } finally {
      setIsCollecting(false);
    }
  }, [
    isOwnProfile, hasUnclaimedRewards, hasPendingPoints,
    accountData, claimRewards, claimPoints
  ]);

  if (!isOwnProfile || !hasAnythingToCollect) {
    return null;
  }

  return (
    <Button
      size="sm"
      appearance="primary"
      disabled={isCollecting}
      isLoading={isCollecting}
      onClick={handleCollectAll}
    >
      {i18next.t("wallet.collect-all")}
    </Button>
  );
}

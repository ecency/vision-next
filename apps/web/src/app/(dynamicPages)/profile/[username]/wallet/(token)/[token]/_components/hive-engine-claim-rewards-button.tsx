"use client";

import { claimRewards } from "@/api/hive-engine";
import { formatError } from "@/api/operations";
import { useClientActiveUser } from "@/api/queries";
import { QueryIdentifiers } from "@/core/react-query";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { formattedNumber } from "@/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { getHiveEngineUnclaimedRewardsQueryOptions } from "@ecency/wallets";

type PendingAmountInfo = {
  formatted: string;
};

export type HiveEngineClaimRewardsButtonProps = {
  className?: string;
};

export function HiveEngineClaimRewardsButton({ className }: HiveEngineClaimRewardsButtonProps) {
  const { token, username } = useParams();
  const activeUser = useClientActiveUser();
  const queryClient = useQueryClient();

  const tokenSymbol = typeof token === "string" ? token.toUpperCase() : undefined;
  const cleanUsername = typeof username === "string" ? username.replace("%40", "") : undefined;

  const { data: unclaimedRewards } = useQuery(
    getHiveEngineUnclaimedRewardsQueryOptions(
      activeUser?.username === cleanUsername ? cleanUsername : undefined
    )
  );

  const pendingReward = useMemo(
    () =>
      tokenSymbol
        ? unclaimedRewards?.find((reward) => reward.symbol?.toUpperCase() === tokenSymbol)
        : undefined,
    [tokenSymbol, unclaimedRewards]
  );

  const pendingAmountInfo = useMemo<PendingAmountInfo | undefined>(() => {
    if (!pendingReward) {
      return undefined;
    }

    const rawPending = Number(pendingReward.pending_token);
    const decimals = Math.max(0, Number(pendingReward.precision ?? 0));
    const divisor = Math.pow(10, decimals);

    if (
      !Number.isFinite(rawPending) ||
      rawPending <= 0 ||
      !Number.isFinite(divisor) ||
      divisor === 0
    ) {
      return undefined;
    }

    const amount = rawPending / divisor;

    return {
      formatted: formattedNumber(amount, { fractionDigits: decimals })
    };
  }, [pendingReward]);

  const canClaim = Boolean(
    tokenSymbol && cleanUsername && activeUser?.username === cleanUsername && pendingAmountInfo
  );

  const { mutate: claimTokenRewards, isPending: isClaiming } = useMutation({
    mutationFn: async ({ formattedAmount }: PendingAmountInfo) => {
      if (!tokenSymbol || !cleanUsername) {
        return formattedAmount;
      }

      await claimRewards(cleanUsername, [tokenSymbol]);
      return formattedAmount;
    },
    onSuccess: async (formattedAmount) => {
      if (!tokenSymbol || !cleanUsername) {
        return;
      }

      success(
        i18next.t("profile-wallet.claim-rewards-success", {
          amount: formattedAmount,
          token: tokenSymbol
        })
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [QueryIdentifiers.HIVE_ENGINE_UNCLAIMED_REWARDS, cleanUsername]
        }),
        queryClient.invalidateQueries({
          queryKey: ["assets", "hive-engine", "balances", cleanUsername]
        }),
        queryClient.invalidateQueries({
          queryKey: ["assets", "hive-engine", tokenSymbol, "transactions", cleanUsername]
        }),
        queryClient.invalidateQueries({
          queryKey: ["ecency-wallets", "asset-info", cleanUsername, tokenSymbol]
        })
      ]);
    },
    onError: (err) => error(...formatError(err))
  });

  if (!canClaim || !pendingAmountInfo) {
    return null;
  }

  return (
    <Button
      size="sm"
      appearance="primary"
      className={clsx("sm:w-auto", className)}
      onClick={() => claimTokenRewards(pendingAmountInfo)}
      isLoading={isClaiming}
      loadingText={i18next.t("profile-wallet.claim-rewards-loading")}
    >
      {i18next.t("profile-wallet.claim-rewards-with-amount", {
        amount: pendingAmountInfo.formatted,
        token: tokenSymbol
      })}
    </Button>
  );
}

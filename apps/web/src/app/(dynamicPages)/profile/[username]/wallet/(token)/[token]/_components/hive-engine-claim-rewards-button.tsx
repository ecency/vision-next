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
import { UilPlus } from "@tooni/iconscout-unicons-react";

type PendingAmountInfo = {
  formatted: string;
};

export type HiveEngineClaimRewardsButtonProps = {
  className?: string;
  tokenSymbol?: string;
  username?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
};

type HiveEngineClaimRewardsState = {
  tokenSymbol?: string;
  username?: string;
  pendingAmountInfo?: PendingAmountInfo;
  hasPendingRewards: boolean;
  canClaim: boolean;
  isOwnProfile: boolean;
};

export function useHiveEngineClaimRewardsState(
  username?: string,
  tokenSymbol?: string,
  enabled = true
): HiveEngineClaimRewardsState {
  const activeUser = useClientActiveUser();

  const sanitizedTokenSymbol = tokenSymbol?.toUpperCase();
  const sanitizedUsername =
    typeof username === "string" ? username.replace("%40", "") : undefined;

  const shouldQuery =
    enabled &&
    Boolean(sanitizedUsername) &&
    activeUser?.username === sanitizedUsername;

  const { data: unclaimedRewards } = useQuery(
    getHiveEngineUnclaimedRewardsQueryOptions(
      shouldQuery && sanitizedUsername ? sanitizedUsername : undefined
    )
  );

  const pendingReward = useMemo(
    () =>
      enabled && sanitizedTokenSymbol
        ? unclaimedRewards?.find(
            (reward) => reward.symbol?.toUpperCase() === sanitizedTokenSymbol
          )
        : undefined,
    [enabled, sanitizedTokenSymbol, unclaimedRewards]
  );

  const pendingAmountInfo = useMemo<PendingAmountInfo | undefined>(() => {
    if (!enabled || !pendingReward) {
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
  }, [enabled, pendingReward]);

  const hasPendingRewards = Boolean(pendingAmountInfo);
  const isOwnProfile = Boolean(
    sanitizedUsername && activeUser?.username === sanitizedUsername
  );
  const canClaim = hasPendingRewards && isOwnProfile;

  return {
    tokenSymbol: sanitizedTokenSymbol,
    username: sanitizedUsername,
    pendingAmountInfo,
    hasPendingRewards,
    canClaim,
    isOwnProfile,
  };
}

export function HiveEngineClaimRewardsButton({
  className,
  tokenSymbol: tokenSymbolProp,
  username: usernameProp,
  showIcon = false,
  fullWidth = false,
}: HiveEngineClaimRewardsButtonProps) {
  const params = useParams();
  const { token, username } = params ?? {};
  const queryClient = useQueryClient();

  const tokenFromParams =
    typeof token === "string" ? token.toUpperCase() : undefined;
  const usernameFromParams =
    typeof username === "string"
      ? username.replace("%40", "")
      : undefined;

  const {
    tokenSymbol,
    username: cleanUsername,
    pendingAmountInfo,
    hasPendingRewards,
    canClaim,
  } = useHiveEngineClaimRewardsState(
    usernameProp ?? usernameFromParams,
    tokenSymbolProp ?? tokenFromParams,
    Boolean(tokenSymbolProp ?? tokenFromParams)
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
          queryKey: ["assets", "hive-engine", "unclaimed", cleanUsername]
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

  if (!hasPendingRewards || !pendingAmountInfo || !tokenSymbol) {
    return null;
  }

  const icon = showIcon ? (
    <UilPlus className="w-3 h-3 text-current" />
  ) : undefined;
  const iconClassName = showIcon
    ? "!w-6 !h-6 rounded-full bg-white text-blue-dark-sky shrink-0"
    : undefined;
  const buttonLabel = `${pendingAmountInfo.formatted} ${tokenSymbol}`.trim();

  return (
    <Button
      size="sm"
      appearance="primary"
      className={clsx("sm:w-auto", className)}
      full={fullWidth}
      icon={icon}
      iconClassName={iconClassName}
      onClick={() => canClaim && claimTokenRewards(pendingAmountInfo)}
      disabled={!canClaim || isClaiming}
      isLoading={isClaiming}
      loadingText={i18next.t("profile-wallet.claim-rewards-loading")}
    >
      {buttonLabel}
    </Button>
  );
}

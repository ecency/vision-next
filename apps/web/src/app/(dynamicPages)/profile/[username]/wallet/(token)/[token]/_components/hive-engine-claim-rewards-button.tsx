"use client";

import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { formattedNumber } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { getAccountWalletAssetInfoQueryOptions } from "@ecency/sdk";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { useClaimEngineRewardsMutation } from "@/api/sdk-mutations";

type PendingAmountInfo = {
  formatted: string;
};

export type HiveEngineClaimRewardsButtonProps = {
  className?: string;
  tokenSymbol?: string;
  username?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
  pendingRewards?: number; // Direct value from portfolio v2
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
  enabled = true,
  pendingRewardsProp?: number // Optional direct value from portfolio v2
): HiveEngineClaimRewardsState {
  const { activeUser } = useActiveAccount();

  const sanitizedTokenSymbol = tokenSymbol?.toUpperCase();
  const sanitizedUsername =
    typeof username === "string" ? username.replace("%40", "") : undefined;

  const shouldQuery =
    enabled &&
    Boolean(sanitizedUsername) &&
    Boolean(sanitizedTokenSymbol) &&
    activeUser?.username === sanitizedUsername &&
    pendingRewardsProp === undefined; // Only query if not provided as prop

  // Get wallet asset info from portfolio v2 (only if not provided as prop)
  const { data: walletAssetInfo } = useQuery({
    ...getAccountWalletAssetInfoQueryOptions(
      sanitizedUsername ?? "",
      sanitizedTokenSymbol ?? ""
    ),
    enabled: shouldQuery
  });

  const pendingAmountInfo = useMemo<PendingAmountInfo | undefined>(() => {
    if (!enabled) {
      return undefined;
    }

    // Use prop value if provided, otherwise get from query
    const rawPending = pendingRewardsProp ?? walletAssetInfo?.pendingRewards;

    if (
      rawPending === undefined ||
      !Number.isFinite(rawPending) ||
      rawPending <= 0
    ) {
      return undefined;
    }

    // Only show rewards if amount is meaningful (> 0.000001)
    // This prevents showing "0.000000+" for dust amounts
    const threshold = 0.000001;
    if (rawPending < threshold) {
      return undefined;
    }

    // Use up to 8 decimal places for precision
    const decimals = 8;
    return {
      formatted: formattedNumber(rawPending, { fractionDigits: decimals })
    };
  }, [enabled, pendingRewardsProp, walletAssetInfo]);

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
  pendingRewards: pendingRewardsProp,
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
    Boolean(tokenSymbolProp ?? tokenFromParams),
    pendingRewardsProp
  );

  const { mutateAsync: claimEngineRewards, isPending: isClaiming } = useClaimEngineRewardsMutation();

  const handleClaim = async () => {
    if (!tokenSymbol || !cleanUsername || !canClaim || !pendingAmountInfo) {
      return;
    }

    try {
      await claimEngineRewards({ tokens: [tokenSymbol] });
      success(
        i18next.t("profile-wallet.claim-rewards-success", {
          amount: pendingAmountInfo.formatted,
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
    } catch (err) {
      error(...formatError(err));
    }
  };

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
      onClick={handleClaim}
      disabled={!canClaim || isClaiming}
      isLoading={isClaiming}
      loadingText={i18next.t("profile-wallet.claim-rewards-loading")}
    >
      {buttonLabel}
    </Button>
  );
}

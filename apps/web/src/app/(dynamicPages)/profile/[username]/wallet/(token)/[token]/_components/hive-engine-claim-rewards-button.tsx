"use client";

import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { formattedNumber } from "@/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { claimHiveEngineRewards, getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { getUser } from "@/utils/user-token";
import { getSdkAuthContext } from "@/utils/sdk-auth";
import { shouldUseHiveAuth } from "@/utils/client";
import { PrivateKey } from "@hiveio/dhive";

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
  const { activeUser } = useActiveAccount();

  const sanitizedTokenSymbol = tokenSymbol?.toUpperCase();
  const sanitizedUsername =
    typeof username === "string" ? username.replace("%40", "") : undefined;

  const shouldQuery =
    enabled &&
    Boolean(sanitizedUsername) &&
    Boolean(sanitizedTokenSymbol) &&
    activeUser?.username === sanitizedUsername;

  // Get wallet asset info from portfolio v2
  const { data: walletAssetInfo } = useQuery({
    ...getAccountWalletAssetInfoQueryOptions(
      sanitizedUsername ?? "",
      sanitizedTokenSymbol ?? ""
    ),
    enabled: shouldQuery
  });

  const pendingAmountInfo = useMemo<PendingAmountInfo | undefined>(() => {
    if (!enabled || !walletAssetInfo) {
      return undefined;
    }

    // Get pending rewards directly from portfolio v2
    const rawPending = walletAssetInfo.pendingRewards;

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
  }, [enabled, walletAssetInfo]);

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
  const { activeUser } = useActiveAccount();
  const params = useParams();
  const { token, username } = params ?? {};
  const queryClient = useQueryClient();
  const auth = useMemo(
    () => (activeUser ? getSdkAuthContext(getUser(activeUser.username)) : undefined),
    [activeUser]
  );

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

      const user = getUser(cleanUsername);
      const loginType = user?.loginType;
      const signType =
        loginType === "hivesigner"
          ? "hivesigner"
          : shouldUseHiveAuth(cleanUsername)
            ? "hiveauth"
            : "keychain";

      if (loginType === "privateKey" && user?.postingKey) {
        await claimHiveEngineRewards({
          account: cleanUsername,
          tokens: [tokenSymbol],
          type: "key",
          key: PrivateKey.fromString(user.postingKey)
        });
      } else {
        await claimHiveEngineRewards(
          { account: cleanUsername, tokens: [tokenSymbol], type: signType },
          auth
        );
      }
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

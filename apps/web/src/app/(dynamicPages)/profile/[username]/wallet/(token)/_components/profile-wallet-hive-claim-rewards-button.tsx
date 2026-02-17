"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useClaimRewardsMutation } from "@/api/sdk-mutations";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { formatError } from "@/api/format-error";

type Props = {
  username: string;
  className?: string;
  showIcon?: boolean;
};

type ClaimState = {
  isOwnProfile: boolean;
  rewardBalance: string;
  rewardAmount: number;
  hasRewards: boolean;
};

export function useProfileWalletHiveClaimState(
  username: string,
  enabled = true
): ClaimState {
  const { activeUser } = useActiveAccount();
  const isOwnProfile = activeUser?.username === username;

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(username),
    enabled: enabled && Boolean(username),
  });

  const rewardBalance = useMemo(
    () => accountData?.reward_hive_balance ?? "0.000 HIVE",
    [accountData?.reward_hive_balance]
  );

  const rewardAmount = useMemo(() => {
    const [value] = rewardBalance.split(" ");
    const parsed = Number.parseFloat(value ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }, [rewardBalance]);

  const hasRewards = rewardAmount > 0;

  return {
    isOwnProfile,
    rewardBalance,
    rewardAmount,
    hasRewards,
  };
}

export function ProfileWalletHiveClaimRewardsButton({
  username,
  className,
  showIcon = false,
}: Props) {
  const { isOwnProfile, rewardBalance, hasRewards } =
    useProfileWalletHiveClaimState(username);

  const { data: accountData } = useQuery({
    ...getAccountFullQueryOptions(username),
    enabled: Boolean(username),
  });

  const { mutateAsync: claimRewards, isPending } = useClaimRewardsMutation();

  if (!hasRewards) {
    return null;
  }

  const icon = showIcon ? (
    <UilPlus className="w-3 h-3 text-current" />
  ) : undefined;
  const iconClassName = showIcon
    ? "!w-6 !h-6 rounded-full bg-white text-blue-dark-sky shrink-0"
    : undefined;

  const handleClaim = async () => {
    if (!isOwnProfile || !accountData) {
      return;
    }

    try {
      await claimRewards({
        rewardHive: accountData.reward_hive_balance,
        rewardHbd: accountData.reward_hbd_balance,
        rewardVests: accountData.reward_vesting_balance,
      });
      success(i18next.t("wallet.claim-reward-balance-ok"));
    } catch (e) {
      error(...formatError(e));
    }
  };

  return (
    <Button
      size="sm"
      appearance="primary"
      className={clsx("sm:w-auto", className)}
      disabled={!isOwnProfile || isPending}
      isLoading={isPending}
      onClick={handleClaim}
      icon={icon}
      iconClassName={iconClassName}
    >
      {rewardBalance}
    </Button>
  );
}

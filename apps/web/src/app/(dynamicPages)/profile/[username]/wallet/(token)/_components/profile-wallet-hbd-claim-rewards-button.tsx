"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { error, success } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useClaimRewards } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { formatError } from "@/api/operations";

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

export function useProfileWalletHbdClaimState(
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
    () => accountData?.reward_hbd_balance ?? "0.000 HBD",
    [accountData?.reward_hbd_balance]
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

export function ProfileWalletHbdClaimRewardsButton({
  username,
  className,
  showIcon = false,
}: Props) {
  const { isOwnProfile, rewardBalance, hasRewards } =
    useProfileWalletHbdClaimState(username);

  const { mutateAsync: claimRewards, isPending } = useClaimRewards(
    username,
    () => success(i18next.t("wallet.claim-reward-balance-ok"))
  );

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
    if (!isOwnProfile) {
      return;
    }

    try {
      await claimRewards();
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


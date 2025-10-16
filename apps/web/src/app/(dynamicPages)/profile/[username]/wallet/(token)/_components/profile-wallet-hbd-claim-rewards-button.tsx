"use client";

import { useClientActiveUser } from "@/api/queries";
import { success } from "@/features/shared";
import { Button } from "@/features/ui";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useClaimRewards } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";

type Props = {
  username: string;
  className?: string;
};

type ClaimState = {
  isOwnProfile: boolean;
  rewardBalance: string;
  hasRewards: boolean;
};

export function useProfileWalletHbdClaimState(
  username: string,
  enabled = true
): ClaimState {
  const activeUser = useClientActiveUser();
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
    hasRewards,
  };
}

export function ProfileWalletHbdClaimRewardsButton({
  username,
  className,
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

  return (
    <Button
      size="sm"
      appearance="primary"
      className={clsx("sm:w-auto", className)}
      disabled={!isOwnProfile || isPending}
      isLoading={isPending}
      onClick={() => isOwnProfile && claimRewards()}
    >
      {rewardBalance}
    </Button>
  );
}

